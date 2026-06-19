import styles from "./StarRating.module.css";

type StarRatingProps = {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  showCount?: boolean;
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`${styles.star} ${filled ? styles.starFilled : ""}`}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
      />
    </svg>
  );
}

export function StarRating({
  rating,
  reviewCount = 0,
  size: _size = "md",
  showCount = true,
}: StarRatingProps) {
  const rounded = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(rounded);
  const hasHalf = rounded - fullStars >= 0.5;

  return (
    <div className={styles.wrap} aria-label={`Ocjena ${rating} od 5`}>
      <span className={styles.stars}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} filled={i < fullStars || (i === fullStars && hasHalf)} />
        ))}
      </span>
      {showCount &&
        (reviewCount > 0 ? (
          <span className={styles.count}>
            {rating > 0 ? rating.toFixed(1) : "—"} ({reviewCount})
          </span>
        ) : (
          <span className={styles.countEmpty}>Nema ocjena</span>
        ))}
    </div>
  );
}
