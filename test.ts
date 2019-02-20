///////////////////////////////////////////////////////////////////////////////

serial.redirectToUSB()

function toFixedString(x: number, ndigits: number = 3) {
    let dx = [0.5, 0.05, 0.005, 0.0005] // used for rounding
    let n = ndigits
    if ( n < 0 ) { n = 0 }
    else if (n > 3) { n = 3 }
    x += dx[n]
    let s = x.toString()
    let pos = s.indexOf('.')
    if (pos >= 0) {
        return s.substr(0, pos+n+1 )
    }
    return s
}

let dev = SHT3X.create( SHT3xAddress.ADDR_0x44 )
serial.writeLine('\r\nTest SHT3X sensor reading....\r\n')

basic.forever(function () {
    let v = dev.readData()
    if (v != null) {
        let t = v[0], h = v[1]
        let str = ''
        str += 'temperature: ' + toFixedString(t,2) + ' deg.C, '
        str += 'humidity: ' + toFixedString(h,2) + ' %RH'
        serial.writeLine( str )
    } else {
        serial.writeLine( dev.getErrorMessage() )
    }
    basic.pause(2000)
})
///////////////////////////////////////////////////////////////////////////////
