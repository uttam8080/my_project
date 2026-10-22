/* eslint-disable no-unused-vars */
import React, { useState, useEffect, use, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  MapPin,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  ArrowRight,
  Upload,
  FileText,
} from "lucide-react";
import GlowButton from "../../components/common/GlowButton";
import axios from "axios";
import AddressAutocomplete from "./AddressAutocomplete";
import { toast } from "react-toastify";
export default function ContactForm() {
  const location = useLocation();
  const paymentUrl = location.state?.paymentUrl;
  const toastShown = useRef(false);
  const [formType, setFormType] = useState("client"); // "client" or "query"
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    subject: [], // Changed to array for multiple selections
    message: "",
    companyName: "", // Added for client forms
    // Career specific fields
    position: "",
    experience: "",
    resume: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (paymentUrl && !toastShown.current) {
      // Pre-fill form fields based on paymentUrl data
      toast(
        "Please fill the form to proceed with your client service or query application.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          newestOnTop: false,
          closeOnClick: true,
          rtl: false,
          pauseOnFocusLoss: true,
          draggable: true,
          pauseOnHover: true,
        },
      );
      toastShown.current = true; // Mark as shown
    }
  }, [paymentUrl]);

  // Check URL parameters on component mount
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const type = query.get("type");
    if (type === "query") {
      setFormType("query");
    } else {
      setFormType("client");
    }
  }, []);

  // Handle form type change - clear form-specific fields
  const handleFormTypeChange = (newType) => {
    setFormType(newType);

    // Clear errors
    setErrors({});

    // Reset form-specific fields
    if (newType === "query") {
      setFormData((prev) => ({
        ...prev,
        position: "",
        experience: "",
        resume: null,
        companyName: "", // Clear company name when switching to query
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subject: [],
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    else if (!/^[A-Za-z\s-]+$/.test(formData.firstName))
      newErrors.firstName = "First name should not contain symbols or numbers";

    if (formData.lastName.trim() && !/^[A-Za-z\s-]+$/.test(formData.lastName))
      newErrors.lastName = "Last name should not contain symbols or numbers";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\s+/g, "")))
      newErrors.phone = "Phone number must be 10 digits";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    if (formType === "client") {
      if (formData.subject.length === 0)
        newErrors.subject = "At least one service is required";
      if (!formData.companyName.trim())
        newErrors.companyName = "Company name is required";
    } else if (formType === "query") {
      // Position, Experience, and Resume validations commented out for now
      // if (!formData.position.trim())
      //   newErrors.position = "Position is required";
      // if (!formData.experience.trim())
      //   newErrors.experience = "Years of experience is required";
      // if (!formData.resume) newErrors.resume = "Resume is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "subject") {
      // Handle checkbox selection for subjects
      const isChecked = e.target.checked;
      setFormData((prev) => {
        let newSubjects = [...prev.subject];

        if (isChecked) {
          // Add subject if not already selected and limit to 2
          if (!newSubjects.includes(value) && newSubjects.length < 2) {
            newSubjects.push(value);
          }
        } else {
          // Remove subject if unchecked
          newSubjects = newSubjects.filter((subject) => subject !== value);
        }

        return {
          ...prev,
          subject: newSubjects,
        };
      });
    } else if (name === "phone") {
      // Limit phone input to 10 digits and only numeric characters
      const phoneValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: phoneValue,
      }));
    } else if (name === "firstName" || name === "lastName") {
      // Filter out special characters and numbers from name fields - allow only letters, spaces, and hyphens
      const nameValue = value.replace(/[^A-Za-z\s-]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: nameValue,
      }));
    }
    // Experience field handling commented out for now
    // else if (name === "experience") {
    //   // Only allow numbers for experience field
    //   const expValue = value.replace(/\D/g, "");
    //   setFormData((prev) => ({
    //     ...prev,
    //     [name]: expValue,
    //   }));
    // }
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          resume: "Please upload a PDF, DOC, or DOCX file",
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          resume: "File size must be less than 5MB",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        resume: file,
      }));

      // Clear error if file is valid
      if (errors.resume) {
        setErrors((prev) => ({
          ...prev,
          resume: undefined,
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    // Validate specific fields on blur
    if (name === "firstName") {
      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, firstName: "First name is required" }));
      } else if (!/^[A-Za-z\s-]+$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          firstName: "First name should not contain symbols or numbers",
        }));
      }
    } else if (name === "lastName") {
      if (value.trim() && !/^[A-Za-z\s-]+$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          lastName: "Last name should not contain symbols or numbers",
        }));
      }
    } else if (name === "phone") {
      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, phone: "Phone number is required" }));
      } else if (!/^\d{10}$/.test(value.replace(/\s+/g, ""))) {
        setErrors((prev) => ({
          ...prev,
          phone: "Phone number must be 10 digits",
        }));
      }
    } else if (name === "email") {
      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, email: "Email is required" }));
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        setErrors((prev) => ({ ...prev, email: "Email is invalid" }));
      }
    } else if (name === "companyName") {
      if (!value.trim()) {
        setErrors((prev) => ({
          ...prev,
          companyName: "Company name is required",
        }));
      }
    }
    // Position and Experience blur validations commented out for now
    // else if (name === "position") {
    //   if (!value.trim()) {
    //     setErrors((prev) => ({ ...prev, position: "Position is required" }));
    //   }
    // } else if (name === "experience") {
    //   if (!value.trim()) {
    //     setErrors((prev) => ({
    //       ...prev,
    //       experience: "Years of experience is required",
    //     }));
    //   }
    // }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]); // Remove data:type;base64, prefix
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // For query applications with file uploads, convert to base64 and send as JSON
      if (formType === "query" && formData.resume) {
        const base64Content = await fileToBase64(formData.resume);

        const submitData = {
          fullName:
            `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          emailId: formData.email,
          phoneNumber: formData.phone,
          address: formData.address,
          selectedServices: [], // Empty for career forms
          message: formData.message,
          userType: "member",
          adminEmail: "saibedamatta@happyprancer.com",
          formType: formType,
          // Add payment redirect flag if coming from payment
          isPaymentRedirect: Boolean(paymentUrl),
          position: formData.position,
          experience: formData.experience,
          attachment: {
            name: formData.resume.name,
            content: base64Content,
          },
        };

        // Make API call with JSON
        const response = await axios.put(
          "https://ikticbkaxh.execute-api.us-east-2.amazonaws.com/dev/any/create-query/tekkzy",
          submitData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        console.log("Form submitted successfully:", response.data);
      } else {
        // For query forms or career forms without files, use JSON
        const submitData = {
          fullName:
            `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          emailId: formData.email,
          phoneNumber: formData.phone,
          address: formData.address,
          selectedServices: formType === "client" ? formData.subject : [],
          message: formData.message,
          userType: "member",
          companyName: formData.companyName,
          adminEmail: "saibedamatta@happyprancer.com",
          formType: formType,
          // Add payment redirect flag if coming from payment
          isPaymentRedirect: Boolean(paymentUrl),
          // Query specific fields (without file)
          // ...(formType === "query" && {
          //   position: formData.position,
          //   experience: formData.experience,
          // }),
        };

        // Make API call with JSON
        const response = await axios.put(
          "https://ozmwa310vk.execute-api.us-east-1.amazonaws.com/dev/any/create-query/tekkzy",
          submitData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        console.log("Form submitted successfully:", response.data);
      }

      setIsSubmitted(true);

      // If there's a payment URL, redirect in the same tab after a short delay
      if (paymentUrl) {
        setTimeout(() => {
          window.location.href = paymentUrl + `${formData.companyName}`; // Use same tab instead of popup
        }, 2000); // 2 second delay to show success message
      }

      // Reset form after success
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        subject: [], // Reset to empty array
        message: "",
        companyName: "", // Reset company name
        position: "",
        experience: "",
        resume: null,
      });
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-[10%] left-[10%] w-48 h-48 bg-cyan-300 rounded-full mix-blend-multiply blur-xl opacity-30 -z-0"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-[20%] right-[10%] w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply blur-xl opacity-30 -z-0"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[40%] w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply blur-xl opacity-30 -z-0"
          animate={{
            scale: [1, 1.3, 1],
            x: [-50, 50, -50],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Vertical Line */}
        <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent opacity-30" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          {/* Header Section */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-6">
              {formType === "query" ? (
                <>
                  Join Our{" "}
                  <span className="font-medium text-blue-300">Team</span>
                </>
              ) : (
                <>
                  Let's{" "}
                  <span className="font-medium text-blue-300">Connect</span>
                </>
              )}
            </h1>
            <p className="text-gray-300/80 text-sm max-w-xl mx-auto mb-8 tracking-wide">
              {formType === "query"
                ? "Ready to be part of something amazing? Join our team and help us build the future of technology together."
                : "Share your vision with us. Our team is ready to bring your ideas to life with exceptional service and attention to detail."}
            </p>
            <GlowButton
              className="text-sm px-6 py-3"
              onClick={() =>
                (window.location.href = "https://awsaiapp.com/Pricing")
              }>
              Discover More
            </GlowButton>
          </motion.div>

          {/* Form Type Selection - Moved to top */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}>
            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0">
              {/* Empty left side to match contact details */}
              <div></div>

              {/* Right side aligned with form */}
              <div className=" flex border-t-2 border-l-2 border-r-2 rounded-xl border-white/20 bg-white/5 backdrop-blur-xl">
                {/* Client/Service Card */}
                <motion.div
                  onClick={() => handleFormTypeChange("client")}
                  className={`cursor-pointer flex-1 p-4 transition-all duration-300 relative overflow-hidden ${
                    formType === "client"
                      ? "bg-blue-400/10"
                      : "hover:bg-white/5"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  layout>
                  {/* Background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
                      formType === "client"
                        ? "from-blue-500/20 to-cyan-500/20 opacity-100"
                        : "opacity-0"
                    }`}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-center space-x-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        formType === "client"
                          ? "bg-blue-400/30 text-blue-300"
                          : "bg-white/10 text-white/60"
                      }`}>
                      <Mail size={16} />
                    </div>
                    <p
                      className={`font-medium text-sm transition-colors ${
                        formType === "client" ? "text-white" : "text-white/80"
                      }`}>
                      Client / Service
                    </p>
                  </div>

                  {/* Active indicator */}
                  {formType === "client" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-3 h-3 bg-blue-400 rounded-full"
                    />
                  )}
                </motion.div>

                {/* Vertical Separator */}
                <div className="w-px bg-white/20 my-2"></div>

                {/* Query Application Card */}
                <motion.div
                  onClick={() => handleFormTypeChange("query")}
                  className={`cursor-pointer flex-1 p-4 transition-all duration-300 relative overflow-hidden ${
                    formType === "query" ? "bg-blue-400/10" : "hover:bg-white/5"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  layout>
                  {/* Background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
                      formType === "query"
                        ? "from-purple-500/20 to-pink-500/20 opacity-100"
                        : "opacity-0"
                    }`}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-center space-x-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        formType === "query"
                          ? "bg-blue-400/30 text-blue-300"
                          : "bg-white/10 text-white/60"
                      }`}>
                      <FileText size={16} />
                    </div>
                    <p
                      className={`font-medium text-sm transition-colors ${
                        formType === "query" ? "text-white" : "text-white/80"
                      }`}>
                      Query Application
                    </p>
                  </div>

                  {/* Active indicator */}
                  {formType === "query" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-3 h-3 bg-blue-400 rounded-full"
                    />
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl mb-28 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="grid md:grid-cols-2 gap-0">
              {/* Contact Information */}
              <motion.div
                className="bg-gradient-to-br from-cyan-300/5 to-cyan-500/10 p-8 md:p-10 m-2 rounded-xl relative overflow-hidden border border-white/10"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/subtle-dots.png')] opacity-10 mix-blend-overlay"></div>
                <h2 className="text-2xl font-light tracking-wide text-white mb-8">
                  Contact Details
                </h2>

                <motion.a
                  href="mailto:admin@awsaiapp.com"
                  className="flex items-center gap-3 text-white/80 mb-6 hover:text-blue-300 transition-colors text-sm"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Mail className="text-blue-400/80" size={18} />
                  <span>admin@awsaiapp.com</span>
                </motion.a>

                {/* Map */}
                <motion.div
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-6 overflow-hidden border border-white/10"
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <div className="w-full h-40 rounded-lg relative overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3566.062224133081!2d83.15526807499944!3d19.895187081485464!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a24e94f5ecce96b%3A0xab85d44ea062c925!2sTekkzy%20Intelligent%20Cloud%20Applications%20Pvt.%20Ltd.!5e1!3m2!1sen!2sin!4v1761386922551!5m2!1sen!2sin"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0"
                      title="Tekkzy Location Map"></iframe>
                    {/* Decorative elements */}
                    <div className="absolute top-3 left-3 w-2 h-2 bg-red-500 rounded-full z-10"></div>
                    <div className="absolute top-6 right-4 w-1.5 h-1.5 bg-blue-500 rounded-full z-10"></div>
                    <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-green-500 rounded-full z-10"></div>
                    <div className="absolute bottom-3 right-3 w-2 h-2 bg-orange-500 rounded-full z-10"></div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-3 text-white/80 mb-8 text-sm"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <MapPin className="text-blue-400/80 mt-0.5" size={18} />
                  <address className="not-italic">
                    <p>V5W5+34J, W Lane 2,</p>
                    <p>Hilltown, Sambhunagar Pada,</p>
                    <p>Bhawanipatna, Odisha 766001</p>
                  </address>
                </motion.div>

                {/* Social Icons - Centered */}
                <div className="flex justify-center gap-3 pt-4 z-20 relative">
                  {[
                    {
                      Icon: Youtube,
                      color: "bg-red-600/90 hover:bg-red-600",
                      link: "https://www.youtube.com/@awsaiapp",
                      label: "YouTube Channel",
                    },
                    {
                      Icon: Instagram,
                      color:
                        "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500",
                      link: "https://www.instagram.com/tekkzy_official/",
                      label: "Instagram Profile",
                    },
                    {
                      Icon: Linkedin,
                      color: "bg-blue-600/90 hover:bg-blue-600",
                      link: "https://www.linkedin.com/company/tekkzy/",
                      label: "LinkedIn Company Page",
                    },
                  ].map(({ Icon, color, link, label }, index) => (
                    <motion.a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      key={index}
                      className={`${color} p-2.5 rounded-full cursor-pointer transition-all relative z-20`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}>
                      <Icon className="text-white" size={18} />
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                className="p-8 md:p-10"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}>
                {isSubmitted ? (
                  <motion.div
                    className="h-full flex flex-col items-center justify-center text-center text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}>
                    <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-400/30">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-light tracking-wide mb-3">
                      Thank You!
                    </h3>
                    <p className="mb-6 text-sm text-white/70">
                      {paymentUrl
                        ? "Your message has been received. You will be redirected to the payment page shortly..."
                        : "Your message has been received. We'll get back to you in 24 hours."}
                    </p>
                    {paymentUrl ? (
                      <motion.button
                        onClick={() =>
                          (window.location.href =
                            paymentUrl + `${formData.companyName}`)
                        }
                        className="text-blue-300/80 hover:text-blue-300 text-sm underline mb-4"
                        whileHover={{ scale: 1.03 }}>
                        Proceed to Payment Now
                      </motion.button>
                    ) : null}
                    <motion.button
                      onClick={() => setIsSubmitted(false)}
                      className="text-blue-300/80 hover:text-blue-300 text-sm underline"
                      whileHover={{ scale: 1.03 }}>
                      Send another message
                    </motion.button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}>
                        <label
                          className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                          htmlFor="firstName">
                          First Name<span className="text-red-400">*</span>
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="Enter your first name"
                          className={`w-full bg-transparent border-b ${
                            errors.firstName
                              ? "border-red-400/80"
                              : "border-white/20"
                          } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors text-sm`}
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-xs text-red-400/80">
                            {errors.firstName}
                          </p>
                        )}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}>
                        <label
                          className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                          htmlFor="lastName">
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="Enter your last name (optional)"
                          className={`w-full bg-transparent border-b ${
                            errors.lastName
                              ? "border-red-400/80"
                              : "border-white/20"
                          } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors text-sm`}
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-xs text-red-400/80">
                            {errors.lastName}
                          </p>
                        )}
                      </motion.div>
                    </div>

                    {/* Email and Phone */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}>
                        <label
                          className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                          htmlFor="email">
                          Email<span className="text-red-400">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="Enter your email address"
                          className={`w-full bg-transparent border-b ${
                            errors.email
                              ? "border-red-400/80"
                              : "border-white/20"
                          } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors text-sm`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-400/80">
                            {errors.email}
                          </p>
                        )}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}>
                        <label
                          className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                          htmlFor="phone">
                          Phone Number<span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center">
                          <span className="text-white/50 mr-2 text-sm">
                            +91
                          </span>
                          <input
                            id="phone"
                            type="tel"
                            name="phone"
                            onBlur={handleBlur}
                            maxLength={10}
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter 10-digit phone number"
                            className={`w-full bg-transparent border-b ${
                              errors.phone
                                ? "border-red-400/80"
                                : "border-white/20"
                            } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors text-sm`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-xs text-red-400/80">
                            {errors.phone}
                          </p>
                        )}
                      </motion.div>
                    </div>

                    {/* Address */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.85 }}>
                      <label
                        className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                        htmlFor="address">
                        Address
                        <span className="text-red-400">*</span>
                      </label>
                      <AddressAutocomplete
                        value={formData.address}
                        onChange={handleInputChange}
                        name="address"
                        error={errors.address}
                      />

                      {errors.address && (
                        <p className="mt-1 text-xs text-red-400/80">
                          {errors.address}
                        </p>
                      )}
                    </motion.div>

                    {/* Conditional Fields Based on Form Type */}
                    {formType === "client" ? (
                      /* Service Selection for Client Form */
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}>
                        <fieldset>
                          <legend className="block text-white/80 text-xs uppercase tracking-wider mb-3">
                            Select Services (Maximum 2)
                            <span className="text-red-400">*</span>
                          </legend>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              "Hotel Management",
                              "Cafe Management",
                              "Both Hotel and Cafe",
                              "Bar Management",
                              "Grocery Management",
                              "Education Management",
                              "Dance Studio & Gym Management",
                            ].map((subject) => (
                              <label
                                key={subject}
                                className="flex items-center cursor-pointer group">
                                <input
                                  type="checkbox"
                                  name="subject"
                                  value={subject}
                                  checked={formData.subject.includes(subject)}
                                  onChange={handleInputChange}
                                  disabled={
                                    !formData.subject.includes(subject) &&
                                    formData.subject.length >= 2
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`w-3.5 h-3.5 rounded border mr-2 flex items-center justify-center transition-colors ${
                                    formData.subject.includes(subject)
                                      ? "border-blue-400 bg-blue-400/20"
                                      : !formData.subject.includes(subject) &&
                                          formData.subject.length >= 2
                                        ? "border-gray-500/50 bg-gray-500/10"
                                        : "border-white/30 group-hover:border-white/50"
                                  }`}>
                                  {formData.subject.includes(subject) && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                      }}>
                                      <svg
                                        className="w-2.5 h-2.5 text-blue-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </motion.div>
                                  )}
                                </div>
                                <span
                                  className={`text-xs tracking-wide ${
                                    !formData.subject.includes(subject) &&
                                    formData.subject.length >= 2
                                      ? "text-gray-500"
                                      : "text-white"
                                  }`}>
                                  {subject}
                                </span>
                              </label>
                            ))}
                          </div>
                          <div>
                            {/* Company Name */}
                            <label
                              className="block text-white/80 text-xs uppercase tracking-wider mt-4 mb-2"
                              htmlFor="companyName">
                              Company Name
                              <span className="text-red-400">*</span>
                            </label>
                            <input
                              id="companyName"
                              type="text"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              placeholder="Enter your company name"
                              className={`w-full bg-transparent border-b ${
                                errors.companyName
                                  ? "border-red-400/80"
                                  : "border-white/20"
                              } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors text-sm`}
                            />
                            {errors.companyName && (
                              <p className="mt-1 text-xs text-red-400/80">
                                {errors.companyName}
                              </p>
                            )}
                          </div>
                          {formData.subject.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 text-xs text-blue-300/70">
                              Selected: {formData.subject.join(", ")} (
                              {formData.subject.length}/2)
                            </motion.div>
                          )}
                          {errors.subject && (
                            <p className="mt-1 text-xs text-red-400/80">
                              {errors.subject}
                            </p>
                          )}
                        </fieldset>
                      </motion.div>
                    ) : (
                      /* Query Form Fields */
                      <>
                        {/* Position Field */}
                        {/* <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.9 }}>
                          <label
                            className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                            htmlFor="position">
                            Position<span className="text-red-400">*</span>
                          </label>
                          <input
                            id="position"
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            placeholder="Enter the position you're applying for"
                            className={`w-full bg-transparent border-b ${
                              errors.position
                                ? "border-red-400/80"
                                : "border-white/20"
                            } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors text-sm`}
                          />
                          {errors.position && (
                            <p className="mt-1 text-xs text-red-400/80">
                              {errors.position}
                            </p>
                          )}
                        </motion.div> */}

                        {/* Experience Field */}
                        {/* <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.95 }}>
                          <label
                            className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                            htmlFor="experience">
                            Years of Experience
                            <span className="text-red-400">*</span>
                          </label>
                          <input
                            id="experience"
                            type="text"
                            name="experience"
                            value={formData.experience}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            placeholder="Enter years of experience (e.g., 3)"
                            className={`w-full bg-transparent border-b ${
                              errors.experience
                                ? "border-red-400/80"
                                : "border-white/20"
                            } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors text-sm`}
                          />
                          {errors.experience && (
                            <p className="mt-1 text-xs text-red-400/80">
                              {errors.experience}
                            </p>
                          )}
                        </motion.div> */}

                        {/* Resume Upload Field */}
                        {/* <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 1.0 }}>
                          <label
                            className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                            htmlFor="resume">
                            Resume<span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <input
                              id="resume"
                              type="file"
                              name="resume"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                              className="sr-only"
                            />
                            <label
                              htmlFor="resume"
                              className={`w-full bg-transparent border-b ${
                                errors.resume
                                  ? "border-red-400/80"
                                  : "border-white/20"
                              } text-white pb-2 focus-within:border-blue-400 transition-colors text-sm flex items-center cursor-pointer hover:border-white/40`}>
                              <Upload className="w-4 h-4 mr-2 text-blue-400" />
                              <span
                                className={
                                  formData.resume
                                    ? "text-white"
                                    : "text-white/30"
                                }>
                                {formData.resume
                                  ? formData.resume.name
                                  : "Click to upload resume (PDF, DOC, DOCX)"}
                              </span>
                              {formData.resume && (
                                <FileText className="w-4 h-4 ml-2 text-green-400" />
                              )}
                            </label>
                          </div>
                          {errors.resume && (
                            <p className="mt-1 text-xs text-red-400/80">
                              {errors.resume}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-white/50">
                            Supported formats: PDF, DOC, DOCX (Max 5MB)
                          </p>
                        </motion.div> */}
                      </>
                    )}

                    {/* Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.0 }}>
                      <label
                        className="block text-white/80 text-xs uppercase tracking-wider mb-2"
                        htmlFor="message">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Write your message.."
                        rows={3}
                        className={`w-full bg-transparent border-b ${
                          errors.message
                            ? "border-red-400/80"
                            : "border-white/20"
                        } text-white placeholder-white/30 pb-2 focus:border-blue-400 focus:outline-none transition-colors resize-none text-sm`}
                      />
                      {errors.message && (
                        <p className="mt-1 text-xs text-red-400/80">
                          {errors.message}
                        </p>
                      )}
                    </motion.div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                      {isSubmitting ? (
                        <div className="bg-gray-700/50 backdrop-blur-sm border border-white/10 text-white px-6 py-2.5 rounded-full inline-flex items-center gap-2 transition-all duration-300 text-sm">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </div>
                      ) : (
                        <div
                          className="transform hover:scale-105 active:scale-95 transition-all duration-300"
                          onClick={handleSubmit}>
                          <GlowButton
                            type="button"
                            className="flex justify-center items-center text-sm px-6 py-2.5">
                            Submit <ArrowRight size={16} className="ml-2" />
                          </GlowButton>
                        </div>
                      )}
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
