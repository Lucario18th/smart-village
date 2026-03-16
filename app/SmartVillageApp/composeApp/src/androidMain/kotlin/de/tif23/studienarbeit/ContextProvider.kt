package de.tif23.studienarbeit

import android.annotation.SuppressLint
import android.content.Context

object ContextProvider {
    @SuppressLint("StaticFieldLeak") // Application Context ist sicher als Singleton
    private var context: Context? = null

    fun init(ctx: Context) {
        context = ctx.applicationContext
    }

    fun getInstance(): Context {
        return context ?: throw IllegalStateException("Context not initialized. Call ContextProvider.init(context) in MainActivity.")
    }
}