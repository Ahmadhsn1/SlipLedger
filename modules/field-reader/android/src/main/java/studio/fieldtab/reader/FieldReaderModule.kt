package studio.fieldtab.reader

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import kotlin.math.max

class FieldReaderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FieldReader")
    AsyncFunction("recognize") { uri: String, pdf: Boolean ->
      val context = requireNotNull(appContext.reactContext)
      val reader = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      try {
        if (!pdf) {
          Tasks.await(reader.process(InputImage.fromFilePath(context, Uri.parse(uri)))).text
        } else {
          val file = File(requireNotNull(Uri.parse(uri).path))
          ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { fd ->
            PdfRenderer(fd).use { document ->
              require(document.pageCount == 1) { "Review multi-page PDFs manually." }
              document.openPage(0).use { page ->
                val scale = 1800.0 / max(page.width, page.height)
                val bitmap = Bitmap.createBitmap(max(1,(page.width*scale).toInt()),max(1,(page.height*scale).toInt()), Bitmap.Config.ARGB_8888)
                try {
                  bitmap.eraseColor(Color.WHITE)
                  page.render(bitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                  Tasks.await(reader.process(InputImage.fromBitmap(bitmap,0))).text
                } finally { bitmap.recycle() }
              }
            }
          }
        }
      } finally { reader.close() }
    }
  }
}
