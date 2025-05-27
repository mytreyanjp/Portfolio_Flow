
export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Myth. All rights reserved.</p>
        <p>Designed with passion by an AI enthusiast.</p>
      </div>
    </footer>
  );
}
