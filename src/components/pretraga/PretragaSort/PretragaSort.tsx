"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPCIJE, type UslugaSortKey } from "@/lib/usluge/constants";
import styles from "./PretragaSort.module.css";

type PretragaSortProps = {
  value: UslugaSortKey;
};

export function PretragaSort({ value }: PretragaSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <label className={styles.wrap}>
      <span className={styles.label}>Sortiraj</span>
      <select className={styles.select} value={value} onChange={handleChange}>
        {SORT_OPCIJE.map((opcija) => (
          <option key={opcija.value} value={opcija.value}>
            {opcija.label}
          </option>
        ))}
      </select>
    </label>
  );
}
