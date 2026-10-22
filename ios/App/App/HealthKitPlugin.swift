import Foundation
import HealthKit
import Capacitor

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "DayframeHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise)
    ]
    private let store = HKHealthStore()

    @objc func authorize(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), let steps = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Apple Здоров’я недоступне на цьому пристрої."); return
        }
        // Read only. HealthKit deliberately does not reveal which read permissions were denied.
        store.requestAuthorization(toShare: [], read: [steps, HKObjectType.workoutType()]) { success, error in
            if error != nil || !success { call.reject("Не вдалося завершити запит доступу до Здоров’я."); return }
            call.resolve(["requestCompleted": true])
        }
    }

    @objc func read(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), let steps = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Apple Здоров’я недоступне на цьому пристрої."); return
        }
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        guard let start = calendar.date(byAdding: .day, value: -29, to: today),
              let end = calendar.date(byAdding: .day, value: 1, to: today) else { call.reject("Не вдалося визначити період."); return }
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = calendar.timeZone
        formatter.dateFormat = "yyyy-MM-dd"
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let group = DispatchGroup()
        var daily: [[String: Any]] = []
        var workouts: [[String: Any]] = []
        var failed = false
        group.enter()
        let query = HKStatisticsCollectionQuery(quantityType: steps, quantitySamplePredicate: predicate, options: .cumulativeSum, anchorDate: today, intervalComponents: DateComponents(day: 1))
        query.initialResultsHandler = { _, results, error in
            DispatchQueue.main.async {
                if error != nil { failed = true }
                results?.enumerateStatistics(from: start, to: Date()) { result, _ in
                    if let sum = result.sumQuantity() {
                        daily.append(["date": formatter.string(from: result.startDate), "steps": Int(sum.doubleValue(for: .count()).rounded())])
                    }
                }
                group.leave()
            }
        }
        store.execute(query)
        group.enter()
        let workoutQuery = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, samples, error in
            DispatchQueue.main.async {
                if error != nil { failed = true }
                for case let workout as HKWorkout in samples ?? [] {
                    workouts.append([
                        "id": workout.uuid.uuidString,
                        "date": formatter.string(from: workout.startDate),
                        "name": Self.workoutName(workout.workoutActivityType),
                        "minutes": min(1440, max(1, Int((workout.duration / 60).rounded())))
                    ])
                }
                group.leave()
            }
        }
        store.execute(workoutQuery)
        group.notify(queue: .main) {
            if failed { call.reject("Не вдалося прочитати Здоров’я. Розблокуй iPhone та перевір дозволи."); return }
            call.resolve(["from": formatter.string(from: start), "to": formatter.string(from: today), "days": daily, "workouts": workouts, "readAt": ISO8601DateFormatter().string(from: Date())])
        }
    }
    private static func workoutName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .walking: return "Ходьба"
        case .running: return "Біг"
        case .cycling: return "Велосипед"
        case .swimming: return "Плавання"
        case .yoga: return "Йога"
        case .pilates: return "Пілатес"
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "Силове тренування"
        case .hiking: return "Похід"
        case .dance: return "Танці"
        case .rowing: return "Веслування"
        case .elliptical: return "Еліптичний тренажер"
        default: return "Тренування зі Здоров’я"
        }
    }
}
