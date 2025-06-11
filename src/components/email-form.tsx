
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

  const onSubmit: SubmitHandler<EmailFormValues> = (data) => {
    console.log("EmailForm onSubmit triggered. Data:", data.companyEmail);

    const performSubmitActions = () => {
      console.log("Performing submit actions: Toast and Form Reset for", data.companyEmail);
      toast({
        title: "Transmission Received",
        description: `Thank you. Your verdict for ${data.companyEmail} will be logged.`,
      });
      form.reset();
    };

    if (audioRef.current) {
      const audioElement = audioRef.current;
      console.log("Audio element found:", audioElement);
      let hasProceeded = false; // Flag to prevent multiple executions

      const cleanupAndProceed = () => {
        if (hasProceeded) {
            console.log("cleanupAndProceed: Already proceeded.");
            return;
        }
        hasProceeded = true;
        console.log("cleanupAndProceed called. Removing 'ended' listener.");
        audioElement.removeEventListener('ended', handleAudioEnd);
        performSubmitActions();
      };

      const handleAudioEnd = () => {
        console.log("Audio 'ended' event fired.");
        cleanupAndProceed();
      };

      // Remove any previous listeners to be safe, though a new ref instance shouldn't have them.
      audioElement.removeEventListener('ended', handleAudioEnd); 
      audioElement.addEventListener('ended', handleAudioEnd);
      
      try {
        console.log("Attempting to load audio: /assets/audio/ill-be-back.mp3");
        audioElement.load(); 
        console.log("Attempting to play audio...");
        const playPromise = audioElement.play();

        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("Audio playback started successfully via promise.");
            // If playback starts and ends, 'ended' event will call cleanupAndProceed
          }).catch(error => {
            console.error("Audio play() promise rejected:", error);
            cleanupAndProceed(); // Proceed if play() fails
          });
        } else {
          // Fallback for browsers that might not return a promise (very old)
          console.warn("play() did not return a promise. Relying on 'ended' event or error during load.");
          // For robustness, consider adding an 'error' listener on audioElement too, which also calls cleanupAndProceed.
        }
      } catch (e) {
        console.error("Synchronous error during audio play setup:", e);
        cleanupAndProceed(); // Proceed on synchronous error
      }
    } else {
      console.log("Audio ref not found. Performing submit actions directly.");
      performSubmitActions();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
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
        <NeonButton type="submit" neonColor="primary" className="w-full" disabled={form.formState.isSubmitting}>
          <Mail className="mr-2 h-6 w-6" />
          {form.formState.isSubmitting ? "TRANSMITTING..." : "RECEIVE YOUR VERDICT"}
        </NeonButton>
      </form>
      <audio ref={audioRef} src="/assets/audio/ill-be-back.mp3" preload="auto" />
    </Form>
  );
};

export default EmailForm;
