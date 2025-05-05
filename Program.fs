open Giraffe
open System
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.Hosting

open Parse
open Fun

[<EntryPoint>]
let main args =
    let builder = WebApplication.CreateBuilder(args)
    builder.Services.AddGiraffe() |> ignore

    let app = builder.Build()
    app.UseStaticFiles() |> ignore


    // app.MapGet("/", Func<string>(fun () -> "Hello World!")) |> ignore
    let webApp =
        choose [
            route "/" >=> htmlFile "./wwwroot/index.html"
            // your other routes
        ]
    app.UseGiraffe(webApp)

    printfn "%A" Parse.e1

    printfn "%A" Parse.e2

    eval Parse.e1 [] |> printfn "%A"    
    eval Parse.e2 [] |> printfn "%A"

    print Parse.e1 |> printfn "%A"
    print Parse.e2 |> printfn "%A"

    app.Run()

    0 // Exit code