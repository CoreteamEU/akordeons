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
    var titleSuffix = " – My Awesome Site"
    var url = URL(static: "https://akordeons.lv")
    var builtInIconsEnabled = true

    var author = "Juris Andersons"

    var homePage = Home()
    var layout = MainLayout()
}


