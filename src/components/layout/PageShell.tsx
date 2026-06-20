import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 py-12", className)}>
      {children}
    </div>
  );
}

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-8", className)}>
      {eyebrow ? (
        <p className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {subtitle ? (
        <p className="text-muted-foreground mt-4 max-w-xl text-lg">{subtitle}</p>
      ) : null}
    </header>
  );
}

type PageCardProps = {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  wide?: boolean;
  title?: string;
  description?: string;
};

export function PageCard({
  children,
  className,
  narrow,
  wide,
  title,
  description,
}: PageCardProps) {
  return (
    <Card
      className={cn(
        narrow && "mx-auto max-w-md",
        wide && "mx-auto max-w-2xl",
        className,
      )}
    >
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={title ? undefined : "pt-6"}>{children}</CardContent>
    </Card>
  );
}

export function PageErrorBanner({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
