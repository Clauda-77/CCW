/**
 * Return the original legacy BILNO for user-facing text while retaining the
 * synthetic memoNumber internally for unique database identity.
 */
export function displayMemoNumber(
  sourceMemoNumber?: string | null,
  internalMemoNumber?: string | null
) {
  const source = sourceMemoNumber?.trim();
  if (source) return source;

  const internal = internalMemoNumber?.trim();
  if (!internal) return "";

  const withoutLegacyPrefix = internal.replace(/^legacy[-_]/i, "");
  const importedKey = withoutLegacyPrefix.match(
    /^(?:SRC|CST)-(.+)-\d{8}-.+$/i
  );
  if (importedKey?.[1]) return importedKey[1];

  const dateSuffixedKey = withoutLegacyPrefix.match(/^(.+)-\d{8}$/);
  if (dateSuffixedKey?.[1]) return dateSuffixedKey[1];

  return withoutLegacyPrefix;
}
