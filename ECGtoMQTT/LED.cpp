#include <Arduino.h>
#include "LED.hpp"

LED_OUT::LED_OUT(pin_t pin) : pin(pin) {
	pinMode(pin, OUTPUT);

	set_off();
}

void LED_OUT::set_on() {
	digitalWrite(pin, HIGH);
}

void LED_OUT::set_off() {
	digitalWrite(pin, LOW);
}

void LED_OUT::represent(unsigned long headtime, unsigned long ontime, unsigned long tailtime) {
	set_off();
	delay(headtime);

	set_on();
	delay(ontime);

	set_off();
	delay(tailtime);
}

void LED_OUT::represent_on(unsigned long elapsedtime) {
	unsigned long headtime = elapsedtime / 5;
	unsigned long ontime;
	unsigned long tailtime = elapsedtime / 5;
	ontime = elapsedtime - headtime - tailtime;
	
	represent(headtime, ontime, tailtime);
}

void LED_OUT::represent_off(unsigned long elapsedtime) {
	unsigned long headtime = elapsedtime / 5 * 2;
	unsigned long ontime;
	unsigned long tailtime = elapsedtime / 5 * 2;
	ontime = elapsedtime - headtime - tailtime;
	
	represent(headtime, ontime, tailtime);
}