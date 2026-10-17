import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-md border-border bg-card text-stone-600 dark:text-stone-300 hover:text-foreground"
        >
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0 text-primary" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100 text-stone-300" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 rounded-md border-border text-xs">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer gap-2 text-xs">
          <Sun className="h-3.5 w-3.5 text-primary" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer gap-2 text-xs">
          <Moon className="h-3.5 w-3.5 text-stone-400" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer gap-2 text-xs">
          <span className="text-xs">💻</span>
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
