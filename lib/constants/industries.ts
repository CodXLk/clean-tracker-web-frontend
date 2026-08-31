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
    /** Real cleaning photography used on the /industries card list. */
    photo: string;
}

/** The sectors Primeway genuinely services — shown on Home and /industries. */
export const INDUSTRIES: Industry[] = [
    { name: "Commercial", icon: Building2, photo: "/images/marketing/industries/gallery-commercial.jpg" },
    { name: "Health Services", icon: Stethoscope, photo: "/images/marketing/services/gallery-hospital-grade-disinfecting.jpg" },
    { name: "Pharmaceutical", icon: Pill, photo: "/images/marketing/industries/gallery-pharmaceutical.jpg" },
    { name: "Education", icon: GraduationCap, photo: "/images/marketing/industries/gallery-education.jpg" },
    { name: "Automotive", icon: Car, photo: "/images/marketing/industries/gallery-automotive.jpg" },
    { name: "Manufacturing", icon: Factory, photo: "/images/marketing/home/floor-scrub-after.jpg" },
    { name: "Logistics", icon: Truck, photo: "/images/marketing/industries/gallery-logistics.jpg" },
    { name: "Hospitality", icon: UtensilsCrossed, photo: "/images/marketing/industries/gallery-hospitality.jpg" },
    { name: "Retail", icon: ShoppingBag, photo: "/images/marketing/home/service-window.jpg" },
    { name: "Retirement & Aged Care", icon: HeartHandshake, photo: "/images/marketing/home/service-disinfecting.jpg" },
];
