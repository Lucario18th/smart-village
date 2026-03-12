package de.tif23.studienarbeit.model.data.responses

import kotlinx.serialization.Serializable
import nl.adaptivity.xmlutil.serialization.XmlElement
import nl.adaptivity.xmlutil.serialization.XmlSerialName

@Serializable
@XmlSerialName("timetable")
data class RemoteTimetableResponse(
	val station: String,
	@XmlElement
	val s: List<Departure>
)

@Serializable
@XmlSerialName("s")
data class Departure(
	val id: String?,
	@XmlElement
	val tl: LineInfo?,
	@XmlElement
	val ar: ArrivalTrainInfo?,
	@XmlElement
	val dp: DepartureTrainInfo?
)

@Serializable
@XmlSerialName("tl")
data class LineInfo(
	val f: String?,
	val t: String?,
	val o: String?,
	val c: String?,
	val n: String?,
)

@Serializable
@XmlSerialName("dp")
data class DepartureTrainInfo(
	val pt: String?,
	val pp: String?,
	val l: String?,
	val fb: String?,
	val tra: String?,
	val pde: String?,
	val wings: String?,
	val ppth: String?
)

@Serializable
@XmlSerialName("ar")
data class ArrivalTrainInfo(
	val pt: String?,
	val pp: String?,
	val l: String?,
	val fb: String?,
	val tra: String?,
	val wings: String?,
	val ppth: String?
)