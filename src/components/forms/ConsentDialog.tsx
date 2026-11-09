import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConsentDialogProps {
  /** true = consents, false = opted out, undefined = not chosen yet */
  checked: boolean | undefined;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

export const ConsentDialog = ({ checked, onCheckedChange, error }: ConsentDialogProps) => {
  const [open, setOpen] = useState(false);
  const value = checked === true ? "yes" : checked === false ? "no" : "";

  return (
    <div className="space-y-2" data-field="consent">
      <div className="space-y-3">
        <div className="flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm font-medium leading-none">
              Photography & Video Recording Preference <span className="text-destructive">*</span>
            </span>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-xs text-primary underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  (Read consent form)
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Parental Consent Form for Photography & Video Recording</DialogTitle>
                <DialogDescription>
                  Please review the consent form below
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold">Amuse Kenya</p>
                    <p>Karura Forest Sigiria, Nairobi, Kenya</p>
                    <p>0114705763</p>
                  </div>

                  <p className="leading-relaxed">
                    Dear Parent/Guardian,
                  </p>

                  <p className="leading-relaxed">
                    We would first of all like to extend a heartfelt gratitude for choosing to bring your child/children to Amuse Kenya. Here, we love capturing memorable moments of children engaging in the many exciting activities offered. As part of our marketing, we use these photos and videos for promotional materials, social media, our website, and other marketing purposes to showcase the fun and enriching experiences we provide. However, we will not be doing this without your prior approval.
                  </p>

                  <p className="leading-relaxed">
                    We value your child's privacy and seek your consent before using any images or videos featuring them. Please review and complete the form below to indicate your preference.
                  </p>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Consent Form</h3>
                    
                    <p className="mb-4">
                      I, the undersigned parent/guardian of the above-named child, hereby:
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <span className="mt-1">☑</span>
                        <p>Grant permission for Amuse Kenya to photograph and videograph my children for use in websites, social media, and other publications or other means of publicity.</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="mt-1">☐</span>
                        <p>Do not grant permission for my child's photographs and videos to be used for any promotional purposes.</p>
                      </div>
                    </div>

                    <p className="font-semibold mb-2">I understand that:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                      <li>My child's name or other personal details will not be shared alongside the images without additional consent.</li>
                      <li>I can withdraw my consent at any time by contacting Amuse Kenya in writing.</li>
                    </ul>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <p className="leading-relaxed">
                      Thank you for your cooperation and support in making Amuse Kenya a fun and welcoming experience for all children!
                    </p>
                    <p className="mt-3">
                      For any questions or concerns, please contact us at <span className="font-semibold">0114705763</span> OR <span className="font-semibold">info@amusekenya.co.ke</span>
                    </p>
                    <p className="mt-4">
                      Sincerely,<br />
                      <span className="font-semibold">Amuse Kenya</span>
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <div className="flex justify-end">
                <Button onClick={() => setOpen(false)}>Close</Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>
        <RadioGroup
          value={value}
          onValueChange={(v) => onCheckedChange(v === "yes")}
          className="space-y-2"
        >
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="yes" id="consent-yes" className="mt-0.5" />
            <Label htmlFor="consent-yes" className="text-sm font-normal leading-snug cursor-pointer">
              I consent to photography and video recording for camp highlights
            </Label>
          </div>
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="no" id="consent-no" className="mt-0.5" />
            <Label htmlFor="consent-no" className="text-sm font-normal leading-snug cursor-pointer">
              I prefer to opt out (do not photograph or record my child)
            </Label>
          </div>
        </RadioGroup>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
