# Auth Agent

## Configuration

The following files must be provided by user:
 * `sp_cert.crt` : signed certificate for Auth Agent
 * `sp_cert_key.pem` : private key to certificate `sp_cert.crt`
 * `Intel_SGX_Attestation_RootCA.pem` : Intel EPID attestation root signing certificate (refer to [link](https://api.portal.trustedservices.intel.com/EPID-attestation))
 * `config.json` : json file containing information specified as the template below
 * `sp_signer_key.pem` : signer key for the intel sgx enclave, used when building graphenized docker image

### `config.json` Template

```
{
  "ip":"<ip address of auth agent server>",
  "ias":{
    "SPID": "<SPID from DEV portal>",
    "primary": "<primary key for EPID attestation API>",
    "secondary": "<secondary key for EPID attestation API(not used in current implementation)>"
  }
}
```

## Running

### Default Configuration
The port of this auth agent is `6380` by default. You may change it inside `auth.js` file.  

The port of the corresponding redis server is `6379` by default. You may change it inside `command.js` file.

### Requirements
 * `node` : tested in `v16.2.0`
 * npm modules : `redis`, `redis-parser`, `jsrsasign`
 * switched from `node-forge` to `jsrsasign` for elliptical curve cryptography support

### Launching in shell

```node auth.js```

### Building docker image

```make```

This builds the auth agent inside graphenized docker image.

```make base-image-auth```

This builds the auth agent inside docker image.
