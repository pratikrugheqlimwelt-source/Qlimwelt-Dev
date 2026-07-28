"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INDUSTRIES,
  COMPANY_SIZES,
  CURRENCIES,
  COUNTRIES,
  type CompanyDetailsData,
} from "@/validation/onboardingSchema";
import { cn } from "@/lib/utils";

interface CompanyDetailsStepProps {
  data: CompanyDetailsData;
  errors: Partial<Record<keyof CompanyDetailsData, string>>;
  onChange: (data: CompanyDetailsData) => void;
}

export function CompanyDetailsStep({ data, errors, onChange }: CompanyDetailsStepProps) {
  const toggleCountry = (country: string) => {
    const set = new Set(data.countriesOfOperation);
    if (set.has(country)) set.delete(country);
    else set.add(country);
    onChange({ ...data, countriesOfOperation: Array.from(set) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Company details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Set up your organisation workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => onChange({ ...data, companyName: e.target.value })}
            className="mt-1.5"
          />
          {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="companyWebsite">Company website</Label>
          <Input
            id="companyWebsite"
            type="url"
            placeholder="https://"
            value={data.companyWebsite ?? ""}
            onChange={(e) => onChange({ ...data, companyWebsite: e.target.value })}
            className="mt-1.5"
          />
          {errors.companyWebsite && <p className="mt-1 text-sm text-red-600">{errors.companyWebsite}</p>}
        </div>

        <div>
          <Label>Industry</Label>
          <Select value={data.industry} onValueChange={(v) => onChange({ ...data, industry: v })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}
        </div>

        <div>
          <Label>Company size</Label>
          <Select value={data.companySize} onValueChange={(v) => onChange({ ...data, companySize: v })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companySize && <p className="mt-1 text-sm text-red-600">{errors.companySize}</p>}
        </div>

        <div>
          <Label>Headquarters country</Label>
          <Select
            value={data.headquartersCountry}
            onValueChange={(v) => onChange({ ...data, headquartersCountry: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.headquartersCountry && <p className="mt-1 text-sm text-red-600">{errors.headquartersCountry}</p>}
        </div>

        <div>
          <Label htmlFor="numberOfEmployees">Number of employees</Label>
          <Input
            id="numberOfEmployees"
            type="number"
            min={0}
            value={data.numberOfEmployees || ""}
            onChange={(e) => onChange({ ...data, numberOfEmployees: Number(e.target.value) })}
            className="mt-1.5"
          />
          {errors.numberOfEmployees && <p className="mt-1 text-sm text-red-600">{errors.numberOfEmployees}</p>}
        </div>

        <div>
          <Label htmlFor="approximateAnnualRevenue">
            Approximate annual revenue <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="approximateAnnualRevenue"
            type="number"
            min={0}
            value={data.approximateAnnualRevenue ?? ""}
            onChange={(e) =>
              onChange({
                ...data,
                approximateAnnualRevenue: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="mt-1.5"
          />
          {errors.approximateAnnualRevenue && (
            <p className="mt-1 text-sm text-red-600">{errors.approximateAnnualRevenue}</p>
          )}
        </div>

        <div>
          <Label>Currency</Label>
          <Select value={data.currency} onValueChange={(v) => onChange({ ...data, currency: v })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="numberOfFacilities">Number of facilities</Label>
          <Input
            id="numberOfFacilities"
            type="number"
            min={0}
            value={data.numberOfFacilities || ""}
            onChange={(e) => onChange({ ...data, numberOfFacilities: Number(e.target.value) })}
            className="mt-1.5"
          />
          {errors.numberOfFacilities && <p className="mt-1 text-sm text-red-600">{errors.numberOfFacilities}</p>}
        </div>

        <div className="sm:col-span-2">
          <Label>Countries of operation</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COUNTRIES.map((country) => {
              const selected = data.countriesOfOperation.includes(country);
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => toggleCountry(country)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selected
                      ? "border-[#82D153] bg-[#82D153]/10 text-[#3d8b2e]"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  {country}
                </button>
              );
            })}
          </div>
          {errors.countriesOfOperation && (
            <p className="mt-1 text-sm text-red-600">{errors.countriesOfOperation}</p>
          )}
        </div>
      </div>
    </div>
  );
}
