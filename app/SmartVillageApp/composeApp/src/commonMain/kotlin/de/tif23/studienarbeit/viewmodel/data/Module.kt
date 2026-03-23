package de.tif23.studienarbeit.viewmodel.data

data class Module(
    val id: Int,
    val name: String,
    val description: String,
    val iconKey: ModuleIcon,
    val sensors: List<Sensor>
)
