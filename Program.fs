open Giraffe
open System
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.Hosting
open Microsoft.AspNetCore.Http
open System.Text.Json
open Microsoft.Extensions.DependencyInjection

open Parse
open Fun
open Absyn

// Convert MicroML AST to jsSyntaxTree format
let rec astToJsSyntaxTree (expr: expr) =
    match expr with
    | CstI i -> sprintf "[N %d]" i
    | CstB b -> sprintf "[B %s]" (if b then "true" else "false")
    | Var x -> sprintf "[Var %s]" x
    | Let(x, erhs, ebody) -> 
        sprintf "[Let [Bind %s] %s %s]" x (astToJsSyntaxTree erhs) (astToJsSyntaxTree ebody)
    | Prim(ope, e1, e2) -> 
        sprintf "[Op %s %s %s]" (ope.ToString()) (astToJsSyntaxTree e1) (astToJsSyntaxTree e2)
    | If(e1, e2, e3) -> 
        sprintf "[If %s %s %s]" (astToJsSyntaxTree e1) (astToJsSyntaxTree e2) (astToJsSyntaxTree e3)
    | Letfun(f, x, fBody, letBody) ->
        sprintf "[Fun [Name %s] [Param %s] %s %s]" f x (astToJsSyntaxTree fBody) (astToJsSyntaxTree letBody)
    | Call(f, e) ->
        sprintf "[Call %s %s]" (astToJsSyntaxTree f) (astToJsSyntaxTree e)

[<EntryPoint>]
let main args =
    let builder = WebApplication.CreateBuilder(args)
    builder.Services.AddGiraffe() |> ignore
    builder.Services.AddCors(fun options -> 
        options.AddDefaultPolicy(fun builder ->
            builder
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader()
                |> ignore
        )
    ) |> ignore

    let app = builder.Build()
    
    app.UseCors() |> ignore
    app.UseStaticFiles() |> ignore

    let parseHandler =
        fun (next : HttpFunc) (ctx : HttpContext) ->
            task {
                use reader = new System.IO.StreamReader(ctx.Request.Body)
                let! content = reader.ReadToEndAsync()
                printfn "Received code for parsing: %s" content
                
                try
                    let ast = Parse.fromString content
                    printfn "Successfully parsed AST: %A" ast
                    let jsTree = astToJsSyntaxTree ast
                    printfn "Converted to JS tree format: %s" jsTree
                    
                    // Set content type explicitly
                    ctx.SetContentType "application/json"
                    
                    let response = {| success = true; tree = jsTree |}
                    printfn "Sending response: %A" response
                    return! json response next ctx
                with 
                | ex -> 
                    printfn "Error parsing code: %s" ex.Message
                    ctx.SetStatusCode 400
                    return! json {| success = false; error = ex.Message |} next ctx
            }

    let webApp =
        choose [
            route "/" >=> htmlFile "wwwroot/index.html"
            POST >=> route "/parse" >=> parseHandler
        ]
    
    app.UseGiraffe(webApp)
    app.Run()
    0