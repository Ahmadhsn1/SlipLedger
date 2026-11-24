Pod::Spec.new do |s|
  s.name = 'FieldReader'
  s.version = '1.0.0'
  s.summary = 'On-device receipt text recognition'
  s.author = 'Fieldtab'
  s.license = { :type => 'Proprietary' }
  s.homepage = 'https://example.invalid/fieldtab'
  s.source = { :git => '' }
  s.platforms = { :ios => '15.1' }
  s.source_files = '**/*.swift'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision', 'PDFKit', 'UIKit'
end
