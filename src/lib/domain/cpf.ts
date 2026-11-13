/** Validação de CPF (dígitos verificadores). Exigido para Pix e NFS-e (Manual 10). */
export function normalizarCpf(v: string): string {
  return v.replace(/\D/g, "");
}

export function cpfValido(v: string): boolean {
  const c = normalizarCpf(v);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(c[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

export function mascararCpf(v: string): string {
  const c = normalizarCpf(v);
  return c.length === 11 ? `***.${c.slice(3, 6)}.***-**` : "***";
}
