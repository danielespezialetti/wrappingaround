// classe di gestione degli errori
export class HttpError extends Error{
    constructor(name, message, status){
        super(message);
        this.name = name || "Internal Server Error";
        this.status = status || 500
    }
}
//Middleware per la gestione degli errori
export async function errorMiddleware (ctx, next){
    try{
        await next();
    } catch (err){
        if (err instanceof HttpError){
            ctx.status = err.status;
            console.error("Errore http: ", err.name, " description: ", err.message);
            return await ctx.render('error',{
                status: ctx.status,
                errName: err.name,
                message: err.message || "Internal server error"
            });
        } else {
            console.error("Errore: ", err.name, " description: ", err.message);
            ctx.status = err.status || 500;
            return await ctx.render('error', {
                status: ctx.status,
                errName: "Internal Server Error",
                message: err.message || "Unexpected error occurred"
            });
        }
    }
};