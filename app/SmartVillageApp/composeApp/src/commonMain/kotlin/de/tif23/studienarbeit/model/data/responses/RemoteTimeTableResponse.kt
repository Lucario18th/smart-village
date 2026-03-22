package de.tif23.studienarbeit.model.data.responses

import kotlinx.serialization.Serializable
import nl.adaptivity.xmlutil.serialization.XmlElement
import nl.adaptivity.xmlutil.serialization.XmlSerialName

@Serializable
@XmlSerialName("timetable")
data class RemoteTimetableResponse(
	val station: String?,
	@XmlElement
	@XmlSerialName("s")
	val timetableEntry: List<TimeTableEntry>
)

@Serializable
@XmlSerialName("s")
data class TimeTableEntry(
	val id: String?,
	@XmlElement
	@XmlSerialName("tl")
	val tripLabel: LineInfo,
	@XmlElement
	@XmlSerialName("ar")
	val arrival: ArrivalTrainInfo?,
	@XmlElement
	@XmlSerialName("dp")
	val departure: DepartureTrainInfo?,
	@XmlElement
	@XmlSerialName("ref")
	val referencedTrip: ReferencedTrip?,
)

@Serializable
@XmlSerialName("ref")
data class ReferencedTrip(
//	@XmlElement
//	val rt: LineInfo?,
	@XmlElement
	val tl: LineInfo?
)
@Serializable
@XmlSerialName("tl")
data class LineInfo(
	@XmlSerialName("f")
	val filterFlag: String?,
	@XmlSerialName("t")
	val tripType: String?,
	@XmlSerialName("o")
	val ownerId: String,
	@XmlSerialName("c")
	val tripCategory: String, // z.B. ICE / IC / RE
	@XmlSerialName("n")
	val trainNumber: String,
)

@Serializable
@XmlSerialName("dp")
data class DepartureTrainInfo(
	@XmlSerialName("pt")
	val plannedTime: String,
	@XmlSerialName("pp")
	val plannedPlatform: String,
	@XmlSerialName("l")
	val line: String?,
	val fb: String?,
	@XmlSerialName("tra")
	val transition: String?,
	@XmlSerialName("pde")
	val plannedDistantEndpoint: String?,
	@XmlSerialName("wings")
	val wings: String?,
	@XmlSerialName("ppth")
	val plannedPath: String,
	@XmlSerialName("cde")
    val changedDistantEndpoint: String?,
	@XmlSerialName("dp")
	val eventChange: String?,
	@XmlSerialName("dc")
	val distantChange: String?,
	@XmlSerialName("hi")
	val isHidden: String?
)

@Serializable
@XmlSerialName("ar")
data class ArrivalTrainInfo(
	@XmlSerialName("pt")
	val plannedTime: String,
	@XmlSerialName("pp")
	val plannedPlatform: String,
	@XmlSerialName("l")
	val line: String?,
	@XmlSerialName("fb")
	val lineFb: String,
	@XmlSerialName("tra")
	val transition: String?,
	val wings: String?,
	@XmlSerialName("pde")
	val plannedDistantEndpoint: String?,
	@XmlSerialName("ppth")
	val plannedPath: String,
	@XmlSerialName("cde")
    val changedDistantEndpoint: String?,
	@XmlSerialName("dp")
	val eventChange: String?,
	@XmlSerialName("dc")
	val distantChange: String?,
	@XmlSerialName("hi")
	val isHidden: String?
)