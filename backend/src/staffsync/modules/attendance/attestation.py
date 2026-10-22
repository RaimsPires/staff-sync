"""App attestation (Play Integrity / App Attest).

Real verification needs Google/Apple credentials. Until they are configured the verdict is `unverified`,
which never blocks a check-in on its own; only a `failed` verdict adds a flag.
"""


async def verify_attestation(platform: str, token: str | None) -> str:
    if not token:
        return "unverified"
    # TODO(provider): call Play Integrity `decodeIntegrityToken` / Apple App Attest validation here.
    return "unverified"
