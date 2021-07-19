# Redis Keyserver

## Configuration

The following files must be provided by user:
 * `sp_cert.crt` : signed certificate for Redis Keyserver
 * `sp_cert_key.pem` : private key to certificate `sp_cert.crt`
 * `../sp_signer_key.pem` : signer key for the intel sgx enclave, used when building graphenized docker image (same key is used with auth agent)

## Running

### Default Configuration

Running in shell is not tested, because this relies on absolute path

### Building docker image

```make```

This builds the redis keyserver inside graphenized docker image.

```make base-image-redis-keyserver```

This builds the redis keyserver inside docker image.
