package de.tif23.studienarbeit.provider

import io.github.davidepianca98.MQTTClient
import io.github.davidepianca98.mqtt.MQTTVersion
import io.github.davidepianca98.mqtt.Subscription
import io.github.davidepianca98.mqtt.packets.Qos
import io.github.davidepianca98.mqtt.packets.mqttv5.ReasonCode
import io.github.davidepianca98.mqtt.packets.mqttv5.SubscriptionOptions
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

object MqttClientProvider {
    private var client: MQTTClient? = null

    private val _messages = MutableSharedFlow<Pair<String, String>>()
    val messages: SharedFlow<Pair<String, String>> = _messages

    @OptIn(ExperimentalUnsignedTypes::class)
    fun connect(brokerHost: String, brokerPort: Int, villageId: Int) {
        client = MQTTClient(
            mqttVersion = MQTTVersion.MQTT5,
            address = brokerHost,
            port = brokerPort,
            tls = null,
            publishReceived = {
                val topic = it.topicName
                val payload = it.payload?.toString() ?: ""

                _messages.tryEmit(topic to payload)
            }
        )
        client?.subscribe(
            listOf(
                Subscription("app/village/$villageId/sensors/#", SubscriptionOptions(Qos.AT_LEAST_ONCE))
            )
        )

        client?.run()
    }

    fun disconnect() {
        client?.disconnect(ReasonCode.DISCONNECT_WITH_WILL_MESSAGE)
        client = null
    }
}