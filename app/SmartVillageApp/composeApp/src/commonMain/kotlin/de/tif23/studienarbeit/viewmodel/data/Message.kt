package de.tif23.studienarbeit.viewmodel.data

import kotlinx.datetime.LocalDateTime

data class Message(
    val id: Int,
    val text: String,
    val priority: String, //TODO: enum?
    val createdAt: LocalDateTime
)
