/* options.h.in
 *
 * Copyright (C) 2006-2021 wolfSSL Inc.
 *
 * This file is part of wolfMQTT.
 *
 * wolfMQTT is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * wolfMQTT is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1335, USA
 */


/* default blank options for autoconf */

#ifndef WOLFMQTT_OPTIONS_H
#define WOLFMQTT_OPTIONS_H

// define types for 16bit CPU of Arduino Uno WiFi Rev 2

#define WOLFMQTT_CUSTOM_TYPES
#include <stdint.h>

typedef	uint8_t		byte;
typedef	uint16_t	word16;
typedef	uint32_t	word32;

#ifdef __cplusplus
extern "C" {
#endif


#ifdef __cplusplus
}
#endif


#endif /* WOLFMQTT_OPTIONS_H */
