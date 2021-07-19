function _to_simplestring(buf){
	if(!(buf instanceof Buffer))
		buf = Buffer.from(buf);
	if(buf.includes('\r') || buf.includes('\n'))
		throw new SyntaxError("Simple String must not contain \\r or \\n");
	
	return Buffer.concat(
		[
			Buffer.from("+"),
			buf,
			Buffer.from("\r\n"),
		]
	);
}

function _to_errorstring(buf){
	if(!(buf instanceof Buffer))
		buf = Buffer.from(buf);
	if(buf.includes('\r') || buf.includes('\n'))
		throw new SyntaxError("Simple String must not contain \\r or \\n");
	
	return Buffer.concat(
		[
			Buffer.from("-"),
			buf,
			Buffer.from("\r\n"),
		]
	);
}

function _to_integer(value){
	if(!(value instanceof String))
		value = value.toString();
	if(!(value instanceof Buffer))
		value = Buffer.from(value);
	
	return Buffer.concat(
		[
			Buffer.from(":"),
			value,
			Buffer.from("\r\n"),
		]
	);
}

function _to_bulkstring(buf){
	if(!(buf instanceof Buffer))
		buf = Buffer.from(buf);
	
	return Buffer.concat(
		[
			Buffer.from("$"),
			Buffer.from(String(buf.length)),
			Buffer.from("\r\n"),
			buf,
			Buffer.from("\r\n"),
		]
	);
}

function _to_array(arr){
	var arrbuf = [
		Buffer.concat(
			[
				Buffer.from("*"),
				Buffer.from(String(arr.length)),
				Buffer.from("\r\n"),
			]
		)
	];

	//expect array of strings
	for(let k=0;k<arr.length;k++){
		let next = arr[k];
		if(!(next instanceof Buffer))
			next = Buffer.from(next);

		arrbuf.push(next);
	}
	
	return Buffer.concat(arrbuf);
}

const resp_null = Buffer.from("$-1\r\n");

function to_resp(obj){
	try{
		if(obj instanceof Array){
			return _to_array(obj.map(to_resp));
		} else if((obj instanceof Buffer) || (obj instanceof String))
			return _to_bulkstring(obj);
		else if(Number.isInteger(obj))
			return _to_integer(obj);
		else if(obj === null)
			return resp_null;
		else
			return _to_bulkstring(obj.toString());
	} catch(err){
		console.error("to_resp on object caused error", obj);
		if(err instanceof TypeError)
			return resp_null;

		else throw err;
	}
}

module.exports.to_errorstring = _to_errorstring;
module.exports.to_integer = _to_integer;
module.exports.to_bulkstring = _to_bulkstring;
module.exports.to_array = _to_array;
module.exports.to_resp = to_resp;
