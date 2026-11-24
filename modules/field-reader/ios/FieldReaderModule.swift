import ExpoModulesCore
import Vision
import PDFKit
import UIKit
import ImageIO
public class FieldReaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FieldReader")
    AsyncFunction("recognize") { (uri: String, pdf: Bool) -> String in
      guard let url = URL(string: uri), url.isFileURL else { throw NSError(domain:"Receipt",code:1) }
      let handler: VNImageRequestHandler
      if pdf {
        guard let doc = PDFDocument(url:url), doc.pageCount == 1, let page = doc.page(at:0) else { throw NSError(domain:"Review multi-page PDF manually",code:2) }
        if let text = page.string, text.trimmingCharacters(in:.whitespacesAndNewlines).count > 12 { return text }
        let bounds = page.bounds(for:.mediaBox)
        let scale = 1800 / max(1,max(bounds.width,bounds.height))
        guard let image = page.thumbnail(of:CGSize(width:bounds.width*scale,height:bounds.height*scale),for:.mediaBox).cgImage else { throw NSError(domain:"Receipt",code:3) }
        handler = VNImageRequestHandler(cgImage:image,options:[:])
      } else {
        handler = VNImageRequestHandler(url:url,options:[:])
      }
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      try handler.perform([request])
      return (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator:"\n")
    }
  }
}
