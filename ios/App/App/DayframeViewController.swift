import Foundation
import Capacitor

class DayframeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        // Health-derived local web storage must not enter automatic iCloud backups.
        if let library = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first {
            var webKit = library.appendingPathComponent("WebKit", isDirectory: true)
            do {
                try FileManager.default.createDirectory(at: webKit, withIntermediateDirectories: true)
                var values = URLResourceValues()
                values.isExcludedFromBackup = true
                try webKit.setResourceValues(values)
            } catch {
                // Refuse to expose HealthKit if its local storage cannot be excluded from backup.
                return
            }
        } else {
            return
        }
        bridge?.registerPluginInstance(HealthKitPlugin())
    }
}
