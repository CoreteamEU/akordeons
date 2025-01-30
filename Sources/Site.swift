import Foundation
import Ignite

@main
struct IgniteWebsite {
    static func main() async {
        let site = ExampleSite()

        do {
            try await site.publish()
        } catch {
            print(error.localizedDescription)
        }
    }
}

struct ExampleSite: Site {    
    var name = "akordeons.lv"
    var titleSuffix = " – akordeons.lv"
    var url = URL(static: "https://coreteameu.github.io/akordeons")
    var builtInIconsEnabled = true

    var author = "Juris Andersons"

    var homePage = Home()
    var layout = MainLayout()
}


