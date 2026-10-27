"use client";
import { FieldError } from "@heroui/react/field-error";
import { Input } from "@heroui/react/input";
import { Label } from "@heroui/react/label";
import { TextField } from "@heroui/react/textfield";
import styles from "@/app/shop.module.css";
export function ContactField({ label, name, type = "text", autoComplete, maxLength, placeholder }: {
  label: string; name: string; type?: "text" | "email" | "tel"; autoComplete: string; maxLength: number; placeholder?: string;
}) {
  return (
    <TextField name={name} type={type} isRequired maxLength={maxLength} autoComplete={autoComplete}
      className={styles.field} variant="secondary">
      <Label>{label}</Label>
      <Input className={styles.input} placeholder={placeholder} />
      <FieldError className={styles.fieldError} />
    </TextField>
  );
}
