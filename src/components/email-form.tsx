"use client";

import React from 'react';
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
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      companyEmail: '',
    },
  });

  const onSubmit: SubmitHandler<EmailFormValues> = (data) => {
    console.log('Company Email Submitted:', data.companyEmail);
    // Here you would typically send the email to your backend
    toast({
      title: "Transmission Received",
      description: `Thank you. Your verdict for ${data.companyEmail} will be logged.`,
    });
    form.reset();
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
    </Form>
  );
};

export default EmailForm;
