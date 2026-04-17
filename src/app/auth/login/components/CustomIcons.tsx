import Box from "@mui/material/Box";

export function GoogleIcon() {
  return (
    <Box component="svg" aria-hidden="true" sx={{ width: 20, height: 20 }} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.8 3.1-4.4 3.1-7.5Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.5-2.3l-3.2-2.6c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4H3.3v2.7A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.3H3.3A10 10 0 0 0 2 12c0 1.6.4 3.1 1.3 4.7L6.6 14Z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 12 2 10 10 0 0 0 3.3 7.3l3.3 2.7c.7-2.3 2.9-4.1 5.4-4.1Z" />
    </Box>
  );
}

export function FacebookIcon() {
  return (
    <Box component="svg" aria-hidden="true" sx={{ width: 20, height: 20 }} viewBox="0 0 24 24">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.8v-8.3H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.3A12 12 0 0 0 24 12Z" />
    </Box>
  );
}

export function SitemarkIcon() {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.2 }}>
      <Box
        component="span"
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2.5,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          color: "#fff",
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          boxShadow: "0 10px 24px rgba(25, 118, 210, 0.35)",
        }}
      >
        M
      </Box>
      <Box component="span" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
        MONEY BOOK
      </Box>
    </Box>
  );
}
