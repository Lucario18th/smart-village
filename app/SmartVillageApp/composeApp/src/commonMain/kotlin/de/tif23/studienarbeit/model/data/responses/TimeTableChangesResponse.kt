package de.tif23.studienarbeit.model.data.responses

import kotlinx.serialization.Serializable
import nl.adaptivity.xmlutil.serialization.XmlElement
import nl.adaptivity.xmlutil.serialization.XmlSerialName

@Serializable
@XmlSerialName("timetable")
data class TimeTableChangesResponse(
    val station: String,
    val eva: String,
    @XmlElement
    @XmlSerialName("s")
    val timetableEntry: List<TimeTableChange>
)

@Serializable
@XmlSerialName("s")
data class TimeTableChange(
    val id: String,
    val eva: String,
    val tl: LineInfo?,
    @XmlElement
    @XmlSerialName("m")
    val messages: List<TrainMessage>?,
    @XmlElement
    @XmlSerialName("ar")
    val arrival: ArrivalTrainChange?,
    @XmlElement
    @XmlSerialName("dp")
    val departure: DepartureTrainChange?
)


@Serializable
@XmlSerialName("m")
data class TrainMessage(
    val id: String,
    @XmlSerialName("t")
    val messageStatus: String,
    @XmlSerialName("from")
    val validFrom: String?,
    @XmlSerialName("to")
    val validTo: String?,
    @XmlSerialName("cat")
    val category: String?,
    @XmlSerialName("c")
    val code: String?,
    @XmlSerialName("ts")
    val timestamp: String,
    @XmlSerialName("ts-tts")
    val ldtTimestamp: String,
    @XmlSerialName("pr")
    val priority: String?,
)

@Serializable
@XmlSerialName("ar")
data class ArrivalTrainChange(
    @XmlSerialName("ct")
    val changedTime: String?,
    @XmlSerialName("cp")
    val changedPlatform: String?,
    @XmlSerialName("l")
    val changedLine: String?,
    @XmlSerialName("cpth")
    val changedPath: String?,
    @XmlSerialName("ppth")
    val plannedPath: String?,
    @XmlSerialName("pp")
    val plannedPlatform: String?,
    @XmlSerialName("pt")
    val plannedTime: String?,
    val fb: String?,
    val hi: String?,
    @XmlSerialName("cs")
    val status: String?,
    @XmlSerialName("clt")
    val cancellationTime: String?,
    @XmlSerialName("wings")
    val changedWings: String?,
    @XmlElement
    @XmlSerialName("m")
    val messages: List<TrainMessage>?
)

@Serializable
@XmlSerialName("dp")
data class DepartureTrainChange(
    @XmlSerialName("ct")
    val changedTime: String?,
    @XmlSerialName("cp")
    val changedPlatform: String?,
    @XmlSerialName("l")
    val changedLine: String?,
    @XmlSerialName("cpth")
    val changedPath: String?,
    @XmlSerialName("ppth")
    val plannedPath: String?,
    @XmlSerialName("pp")
    val plannedPlatform: String?,
    @XmlSerialName("pt")
    val plannedTime: String?,
    val fb: String?,
    val hi: String?,
    @XmlSerialName("cs")
    val status: String?,
    @XmlSerialName("clt")
    val cancellationTime: String?,
    @XmlSerialName("wings")
    val changedWings: String?,
    @XmlElement
    @XmlSerialName("m")
    val messages: List<TrainMessage>?
)