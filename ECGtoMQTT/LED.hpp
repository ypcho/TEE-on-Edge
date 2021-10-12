#ifndef _LED_H_
#define _LED_H_

class LED_OUT {
private:
  using pin_t = decltype(LED_BUILTIN);

  pin_t pin;

public:
  LED_OUT(pin_t pin);

  void set_on();
  void set_off();
  void represent(unsigned long headtime, unsigned long ontime, unsigned long tailtime);
  void represent_on(unsigned long elapsedtime);
  void represent_off(unsigned long elapsedtime);
};

#endif