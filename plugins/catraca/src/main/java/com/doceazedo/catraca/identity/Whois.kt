package com.doceazedo.catraca.identity

import com.doceazedo.catraca.enums.Env
import com.google.gson.Gson
import khttp.responses.Response
import org.bukkit.Bukkit
import org.json.JSONObject

object Whois {
    data class Identity(
        val uuid: String,
        val email: String,
        val verified: Boolean,
        val primaryUsername: String,
        val usernames: Array<String>
    )

    fun whois (username: String): Identity? {
        return try {
            val resp: Response = khttp.get("${Env.IDENTITY_URL.value}/api/v1/whois/$username", mapOf("Authorization" to "Bearer ${Env.IDENTITY_TOKEN.value}"))
            val data: JSONObject = resp.jsonObject
            Gson().fromJson(data["identity"].toString(), Identity::class.java)
        } catch (cause: Throwable) {
            Bukkit.getLogger().warning("An error ocurred when trying to fetch ${Env.IDENTITY_URL}/api/v1/whois/$username")
            cause.printStackTrace()
            null
        }
    }
}