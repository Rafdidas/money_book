"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useState } from "react";

export default function ForgotPassword({
  open,
  handleClose,
}: {
  open: boolean;
  handleClose: () => void;
}) {
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleClose();
    setEmail("");
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter your email address and we will send you a password reset link.
        </Typography>
        <form id="forgot-password-form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            fullWidth
            label="Email"
            margin="dense"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit" form="forgot-password-form" variant="contained">
          Send link
        </Button>
      </DialogActions>
    </Dialog>
  );
}
