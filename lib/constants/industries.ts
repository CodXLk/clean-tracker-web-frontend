import type { LucideIcon } from "lucide-react";
import {
    Building2,
    Stethoscope,
    Pill,
    GraduationCap,
    Car,
    Factory,
    Truck,
    UtensilsCrossed,
    ShoppingBag,
    HeartHandshake,
} from "lucide-react";

export interface Industry {
    name: string;
    icon: LucideIcon;
}

/** The sectors Primeway genuinely services — shown on Home and /industries. */
export const INDUSTRIES: Industry[] = [
    { name: "Commercial", icon: Building2 },
    { name: "Health Services", icon: Stethoscope },
    { name: "Pharmaceutical", icon: Pill },
    { name: "Education", icon: GraduationCap },
    { name: "Automotive", icon: Car },
    { name: "Manufacturing", icon: Factory },
    { name: "Logistics", icon: Truck },
    { name: "Hospitality", icon: UtensilsCrossed },
    { name: "Retail", icon: ShoppingBag },
    { name: "Retirement & Aged Care", icon: HeartHandshake },
];
