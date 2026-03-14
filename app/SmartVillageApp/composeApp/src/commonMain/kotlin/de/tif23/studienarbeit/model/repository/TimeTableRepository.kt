package de.tif23.studienarbeit.model.repository

import de.tif23.studienarbeit.BuildKonfig
import de.tif23.studienarbeit.model.constants.DB_TIMETABLES_API_URL
import de.tif23.studienarbeit.model.data.responses.RemoteTimetableResponse
import de.tif23.studienarbeit.util.getKtorClient
import io.ktor.client.request.get
import io.ktor.client.request.headers
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import nl.adaptivity.xmlutil.serialization.XML

class TimeTableRepository {
    private val client = getKtorClient()

    suspend fun getPlanTimetable(evaNo: String, date: String, hour: String): RemoteTimetableResponse {
        val result = client.get("$DB_TIMETABLES_API_URL/plan/$evaNo/$date/$hour") {
            headers {
                append(HttpHeaders.Accept, "application/xml")
                append("DB-Client-ID", BuildKonfig.DB_CLIENT_ID)
                append("DB-Api-Key", BuildKonfig.DB_CLIENT_SECRET)
            }
        }
        val xmlResponse = result.bodyAsText()
        println(xmlResponse)
        return XML.v1.decodeFromString(RemoteTimetableResponse.serializer(), xmlResponse)
    }
}