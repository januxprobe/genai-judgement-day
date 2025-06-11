
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
    if (audioRef.current) {
      const audioElement = audioRef.current;
      console.log("NeonButton onClick: Attempting to play audio...");

      // Using a flag to prevent multiple calls to cleanup/proceed if events fire closely
      let audioActionCompleted = false;
      const onAudioAttemptFinished = () => {
        if (audioActionCompleted) return;
        audioActionCompleted = true;
        console.log("NeonButton onClick: Audio attempt finished (played or error).");
        audioElement.removeEventListener('ended', onAudioAttemptFinished);
        // No further action needed here for button click audio
      };
      
      audioElement.removeEventListener('ended', onAudioAttemptFinished); // Clean up previous if any
      audioElement.addEventListener('ended', onAudioAttemptFinished);
      
      try {
        console.log("NeonButton onClick: Loading audio: /assets/audio/ill-be-back.mp3");
        audioElement.load(); 
        const playPromise = audioElement.play();

        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("NeonButton onClick: Audio playback started successfully via promise.");
          }).catch(error => {
            console.error("NeonButton onClick: Audio play() promise rejected:", error);
            onAudioAttemptFinished(); 
          });
        } else {
           console.warn("NeonButton onClick: play() did not return a promise.");
           // For very old browsers, rely on 'ended' or 'error' events on audioElement
        }
      } catch (e) {
        console.error("NeonButton onClick: Synchronous error during audio play setup:", e);
        onAudioAttemptFinished();
      }
    } else {
      console.log("NeonButton onClick: Audio ref not found.");
    }
  };

  const handleFormSubmit: SubmitHandler<EmailFormValues> = (data) => {
    // This function is only called if form validation is successful
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
