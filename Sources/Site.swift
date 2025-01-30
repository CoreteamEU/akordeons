import Foundation
import Ignite

@main
struct Website {
    static func main() async {
        let site = AkordeonsSite()
        do {
            try await site.publish()
        } catch {
            print(error.localizedDescription)
        }
    }
}

struct AkordeonsSite: Site {
    var name = "akordeons.lv"
    var titleSuffix = " – akordeons.lv"
    var url = URL(static: "https://coreteameu.github.io/akordeons/") // github url
    var builtInIconsEnabled = false

    var author = "Juris Andersons"

    var homePage = Home()
    var layout = MainLayout()
}
