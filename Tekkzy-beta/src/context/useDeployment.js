import { useState } from 'react';
import { useApi } from './ApiContext';
import { resolveRazorpayKeyId } from '../config/appEnv';

export const useDeployment = () => {
    const {
        checkDomainAvailability,
        checkSubdomainAvailability,
        registerDomain,
        startDomainSetup,
        checkDomainValidation,
        createCloudfront,
        createDomainDNSRecord,
        deploySite, // existing from ApiContext
        getSite,
        createPaymentSession,
        finalizePaymentSession,
        attachDomain,
    } = useApi();

    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState(null);

    const getFullDomain = (domainInfo) => {
        if (domainInfo.type === 'subdomain') {
            const sub = String(domainInfo.domain || '').replace('.tekkzy.com', '').trim();
            return `${sub}.tekkzy.com`;
        }
        return String(domainInfo.domain || '').trim();
    };

    const emitProgress = (updateProgress, step, status, message, totalSteps) => {
        updateProgress({ step, status, message, totalSteps });
    };

    const buildDnsInstruction = (stage, apiResponse) => {
        if (!apiResponse?.dnsRecord) return null;

        return {
            stage,
            title: stage === 'ssl-validation' ? 'SSL Validation Record' : 'Domain Routing Record',
            message: apiResponse?.message || '',
            record: {
                type: apiResponse.dnsRecord.type,
                name: apiResponse.dnsRecord.name,
                value: apiResponse.dnsRecord.value,
            },
        };
    };

    const checkSubdomain = async (subdomain) => {
        try {
            // Assuming a default root domain for the platform: tekkzy.com
            return await checkSubdomainAvailability(subdomain, 'tekkzy.com');
        } catch (err) {
            console.error(err);
            return { available: false, error: err.message };
        }
    };

    const checkCustomDomain = async (domain) => {
        try {
            return await checkDomainAvailability(domain);
        } catch (err) {
            console.error(err);
            return { available: false, error: err.message };
        }
    };

    const loadRazorpayScript = () => {
        if (window.Razorpay) return Promise.resolve(true);

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const loadPayPalScript = (currency, clientIdFromSession) => {
        if (window.paypal) return Promise.resolve(true);

        const paypalClientId = clientIdFromSession || import.meta.env.VITE_PAYPAL_CLIENT_ID;
        if (!paypalClientId) {
            throw new Error('PayPal client ID is missing. Configure PAYPAL_CLIENT_ID on backend or set VITE_PAYPAL_CLIENT_ID in frontend .env.');
        }

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${currency}&intent=capture`;
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const startPaypalPayment = async ({
        session,
        siteId,
        planId,
        paymentType,
        customer,
        metadata,
        countryCode,
    }) => {
        const paypalCurrency = session?.plan?.currency || 'USD';
        const paypalClientId = session?.paypal?.clientId;

        const scriptLoaded = await loadPayPalScript(paypalCurrency, paypalClientId);
        if (!scriptLoaded || !window.paypal) {
            throw new Error('Failed to load PayPal checkout script.');
        }

        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.inset = '0';
        wrapper.style.background = 'rgba(0,0,0,0.75)';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.zIndex = '9999';

        const box = document.createElement('div');
        box.style.background = '#111';
        box.style.padding = '20px';
        box.style.borderRadius = '12px';
        box.style.minWidth = '320px';
        box.style.border = '1px solid #2b2b2b';

        const paypalContainer = document.createElement('div');
        box.appendChild(paypalContainer);
        wrapper.appendChild(box);
        document.body.appendChild(wrapper);

        const cleanup = () => {
            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
        };

        return await new Promise((resolve, reject) => {
            const rejectWithCleanup = (err) => {
                cleanup();
                reject(err);
            };

            window.paypal
                .Buttons({
                    style: {
                        layout: 'vertical',
                        shape: 'rect',
                    },
                    createOrder: async () => {
                        if (!session?.paypal?.orderId) {
                            throw new Error('PayPal order was not created.');
                        }

                        return session.paypal.orderId;
                    },
                    onApprove: async (data) => {
                        try {
                            const captureRes = await finalizePaymentSession({
                                provider: 'PAYPAL',
                                orderId: data?.orderID || session?.paypal?.orderId,
                                siteId,
                                planId,
                                paymentType,
                                countryCode,
                                customer,
                                metadata,
                            });

                            if (!captureRes?.success) {
                                throw new Error(captureRes?.error || captureRes?.message || 'PayPal payment capture failed.');
                            }

                            cleanup();
                            resolve({
                                success: true,
                                transactionId: captureRes.transactionId || data?.orderID,
                                orderId: data?.orderID,
                            });
                        } catch (err) {
                            rejectWithCleanup(err);
                        }
                    },
                    onCancel: () => {
                        rejectWithCleanup(new Error('Payment was cancelled.'));
                    },
                    onError: (err) => {
                        rejectWithCleanup(new Error(err?.message || 'PayPal checkout failed.'));
                    },
                })
                .render(paypalContainer)
                .catch((err) => rejectWithCleanup(new Error(err?.message || 'PayPal checkout render failed.')));
        });
    };

    const startPayment = async ({
        siteId,
        planId,
        paymentType,
        amount,
        countryCode,
        customer,
        metadata,
    }) => {
        if (!amount || Number(amount) <= 0) {
            return { success: true, skipped: true, transactionId: `free_${Date.now()}` };
        }

        const session = await createPaymentSession({
            siteId,
            planId,
            paymentType,
            countryCode,
            metadata,
        });

        if (!session?.success || !session?.provider) {
            throw new Error(session?.error || session?.message || 'Unable to initialize payment session.');
        }

        const normalizedMethod = String(session.provider).toUpperCase();

        if (normalizedMethod === 'PAYPAL') {
            return await startPaypalPayment({
                session,
                siteId,
                planId,
                paymentType,
                customer,
                metadata,
                countryCode,
            });
        }

        const razorpayKeyId = resolveRazorpayKeyId();
        if (!razorpayKeyId) {
            throw new Error(
                'Razorpay key is missing. Set VITE_RAZORPAY_KEY_ID_BETA / VITE_RAZORPAY_KEY_ID_PROD in .env.',
            );
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            throw new Error('Failed to load Razorpay checkout script.');
        }

        if (!session?.razorpay?.subscriptionId) {
            throw new Error('Unable to create Razorpay subscription.');
        }

        return await new Promise((resolve, reject) => {
            const options = {
                key: razorpayKeyId,
                subscription_id: session.razorpay.subscriptionId,
                name: 'Tekkzy',
                description: paymentType === 'domain-registration' ? 'Domain Registration' : 'Hosting Plan',
                prefill: {
                    name: customer?.name || '',
                    email: customer?.email || '',
                    contact: customer?.phone || '',
                },
                notes: {
                    siteId,
                    planId,
                    paymentType,
                },
                theme: {
                    color: '#2563eb',
                },
                handler: async (razorpayResponse) => {
                    try {
                        const verifyRes = await finalizePaymentSession({
                            provider: 'RAZORPAY',
                            razorpay_order_id: razorpayResponse.razorpay_order_id,
                            razorpay_subscription_id: razorpayResponse.razorpay_subscription_id,
                            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                            razorpay_signature: razorpayResponse.razorpay_signature,
                            siteId,
                            planId,
                            paymentType,
                            countryCode,
                            customer,
                            metadata,
                        });

                        if (!verifyRes?.success) {
                            throw new Error(verifyRes?.error || 'Payment verification failed.');
                        }

                        resolve({
                            success: true,
                            transactionId: verifyRes.transactionId || razorpayResponse.razorpay_payment_id,
                            orderId: razorpayResponse.razorpay_order_id,
                            subscriptionId: razorpayResponse.razorpay_subscription_id,
                            paymentId: razorpayResponse.razorpay_payment_id,
                        });
                    } catch (err) {
                        reject(err);
                    }
                },
                modal: {
                    ondismiss: () => {
                        reject(new Error('Payment was cancelled.'));
                    },
                },
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on('payment.failed', (response) => {
                const reason = response?.error?.description || response?.error?.reason || 'Payment failed.';
                reject(new Error(reason));
            });

            razorpay.open();
        });
    };

    const waitForCertificate = async (certificateArn, hostedZoneId) => {

        const maxAttempts = 20;
        const delay = 5000; // 5 seconds

        for (let i = 0; i < maxAttempts; i++) {

            const res = await checkDomainValidation(
                certificateArn,
                hostedZoneId
            );
            console.log("result;",res);

            if (res?.status === "ISSUED") {
                return true;
            }

            if (res?.status === "FAILED") {
                throw new Error("Certificate validation failed");
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }

        throw new Error("SSL validation timeout");
    };

    const runDeploymentSequence = async (
        siteId,
        domainInfo,
        updateProgress,
        waitForManualDnsConfirmation = async () => true
    ) => {

        setIsDeploying(true);
        setError(null);
        let activeStep = 1;
        const manualDnsInstructions = [];

        try {

            const fullDomain = getFullDomain(domainInfo);
            const isRegistrationFlow = domainInfo.type === 'register';
            const isReuseInfra = Boolean(domainInfo.reusedInfrastructure);
            const totalSteps = isReuseInfra ? 1 : isRegistrationFlow ? 6 : 5;

            /* Step 1 — Deploy Site */

            activeStep = 1;
            emitProgress(updateProgress, activeStep, 'loading', 'Deploying site files...', totalSteps);

            await deploySite(siteId);

            emitProgress(updateProgress, 1, 'success', 'Site deployed', totalSteps);

            if (isReuseInfra) {
                setIsDeploying(false);
                return { success: true, dnsInstructions: [], reusedInfrastructure: true };
            }

            /* Step 2 — Register Domain (only for registration flow) */

            if (isRegistrationFlow) {
                activeStep = 2;
                emitProgress(updateProgress, activeStep, 'loading', 'Starting domain registration...', totalSteps);

                const registrationRes = await registerDomain(fullDomain, {
                    ...(domainInfo.contact || {}),
                    years: domainInfo.registrationYears,
                });

                if (!registrationRes?.success) {
                    throw new Error(registrationRes?.error || 'Domain registration failed');
                }

                emitProgress(updateProgress, 2, 'success', 'Domain registration started', totalSteps);
            }
            /* Step 2 — SSL */

            const sslStep = isRegistrationFlow ? 3 : 2;
            activeStep = sslStep;
            emitProgress(updateProgress, sslStep, 'loading', 'Creating SSL certificate...', totalSteps);

            const setupRes = await startDomainSetup(
                siteId,
                fullDomain,
                domainInfo.hostedZoneId
            );

            const sslDnsInstruction = buildDnsInstruction('ssl-validation', setupRes);
            if (sslDnsInstruction) {
                manualDnsInstructions.push(sslDnsInstruction);
                updateProgress({
                    step: sslStep,
                    status: 'loading',
                    message: 'Manual SSL DNS validation required. Add the record shown below, then wait for validation.',
                    totalSteps,
                    dnsInstructions: [...manualDnsInstructions],
                });

                await waitForManualDnsConfirmation(sslDnsInstruction);
            } else {
                emitProgress(updateProgress, sslStep, 'success', 'SSL certificate requested', totalSteps);
            }


            /* Step 3 — Validate SSL */

            const validationStep = isRegistrationFlow ? 4 : 3;
            activeStep = validationStep;
            emitProgress(updateProgress, validationStep, 'loading', 'Validating domain ownership...', totalSteps);

            await waitForCertificate(
                setupRes.certificateArn,
                domainInfo.hostedZoneId
            );

            emitProgress(updateProgress, validationStep, 'success', 'Domain validated', totalSteps);


            /* Step 4 — CloudFront */

            const cdnStep = isRegistrationFlow ? 5 : 4;
            activeStep = cdnStep;
            emitProgress(updateProgress, cdnStep, 'loading', 'Creating CDN distribution...', totalSteps);

            await createCloudfront(
                siteId,
                fullDomain,
                setupRes.certificateArn
            );

            emitProgress(updateProgress, cdnStep, 'success', 'CDN distribution created', totalSteps);


            /* Step 5 — DNS */

            const dnsStep = isRegistrationFlow ? 6 : 5;
            activeStep = dnsStep;
            const dnsMessage = domainInfo.type === 'connect'
                ? 'Connecting external domain DNS...'
                : 'Configuring DNS records...';
            emitProgress(updateProgress, dnsStep, 'loading', dnsMessage, totalSteps);

            const dnsRes = await createDomainDNSRecord(
                siteId,
                fullDomain,
                domainInfo.hostedZoneId
            );

            const domainDnsInstruction = buildDnsInstruction('domain-routing', dnsRes);
            if (domainDnsInstruction) {
                manualDnsInstructions.push(domainDnsInstruction);
                updateProgress({
                    step: dnsStep,
                    status: 'loading',
                    message: 'Automatic DNS setup is unavailable. Add the DNS record shown below in your hosted zone.',
                    totalSteps,
                    dnsInstructions: [...manualDnsInstructions],
                });

                await waitForManualDnsConfirmation(domainDnsInstruction);

                emitProgress(updateProgress, dnsStep, 'success', 'Manual DNS record acknowledged. Domain setup completed.', totalSteps);
            } else {
                emitProgress(updateProgress, dnsStep, 'success', 'Domain connected', totalSteps);
            }



            setIsDeploying(false);

            return { success: true, dnsInstructions: manualDnsInstructions };

        } catch (err) {

            console.error(err);

            setError(err.message || "Deployment failed");
            setIsDeploying(false);

            updateProgress({
                step: activeStep,
                status: 'error',
                message: err.message || 'Deployment failed',
                error: err
            });

            return { success: false, error: err };

        }
    };

    return {
        isDeploying,
        error,
        checkSubdomain,
        checkCustomDomain,
        startPayment,
        runDeploymentSequence,
        attachDomain,
    };
};
