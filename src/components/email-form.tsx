
"use client";

import React, { useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import NeonButton from './neon-button';
import { useToast } from "@/hooks/use-toast";
import { Mail } from 'lucide-react';

const emailFormSchema = z.object({
  companyEmail: z.string().email({ message: "Invalid email address format." }).min(1, { message: "Email is required." }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailFormProps {
    className?: string;
}

const EmailForm: React.FC<EmailFormProps> = ({ className }) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      companyEmail: '',
    },
  });

  const handleAudioPlayback = () => {
    console.log("NeonButton onClick: handleAudioPlayback CALLED."); // First log
    if (audioRef.current) {
      console.log("NeonButton onClick: audioRef.current IS VALID.");
      const audioElement = audioRef.current;
      console.log("NeonButton onClick: Attempting to load audio:", audioElement.src);
      audioElement.load();
      const playPromise = audioElement.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("NeonButton onClick: Audio playback started successfully via promise.");
        }).catch(error => {
          console.error("NeonButton onClick: Audio play() promise rejected:", error);
        });
      } else {
         console.warn("NeonButton onClick: play() did not return a promise (older browser?).");
      }
    } else {
      console.error("NeonButton onClick: audioRef.current IS NULL.");
    }
  };

  const handleFormSubmit: SubmitHandler<EmailFormValues> = (data) => {
    // This function is only called if form validation is successful
    // The audio playback is now handled by the button's direct onClick
    console.log("EmailForm handleFormSubmit triggered. Data:", data.companyEmail);
    toast({
      title: "Transmission Received",
      description: `Thank you. Your verdict for ${data.companyEmail} will be logged.`,
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className={`space-y-6 ${className}`}>
        <FormField
          control={form.control}
          name="companyEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xl neon-text-secondary uppercase">Enter Your Company Email:</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  {...field}
                  className="bg-input border-primary text-foreground placeholder:text-muted-foreground focus:ring-secondary text-lg py-6 px-4"
                />
              </FormControl>
              <FormMessage className="text-destructive neon-text-primary" />
            </FormItem>
          )}
        />
        <NeonButton
          type="submit"
          neonColor="primary"
          className="w-full"
          disabled={form.formState.isSubmitting}
          onClick={handleAudioPlayback} // Play audio on any click
        >
          <Mail className="mr-2 h-6 w-6" />
          {form.formState.isSubmitting ? "TRANSMITTING..." : "RECEIVE YOUR VERDICT"}
        </NeonButton>
      </form>
      <audio ref={audioRef} src="/assets/audio/ill-be-back.mp3" preload="auto" />
    </Form>
  );
};

export default EmailForm;
