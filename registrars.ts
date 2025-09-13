import { KenicRegistrar } from '../types';

export const kenicRegistrars: KenicRegistrar[] = [
  {
    id: "truehost",
    name: "Truehost Cloud Limited", 
    phone: "+25420 790 3111",
    email: "info@truehost.co.ke"
  },
  {
    id: "kwe",
    name: "Kenya Website Experts",
    phone: "0722 209 414", 
    email: "info@kenyawebexperts.co.ke"
  },
  {
    id: "sasahost",
    name: "Sasahost",
    phone: "+254 20 2498888",
    email: "info@sasahost.co.ke"
  },
  {
    id: "webhost",
    name: "Web Host Kenya",
    phone: "0722 386 389",
    email: "info@webhostkenya.co.ke"
  },
  {
    id: "hostpinnacle",
    name: "Host Pinnacle",
    phone: "0700 000 000",
    email: "info@hostpinnacle.co.ke"
  },
  {
    id: "kenic",
    name: "Kenya Network Information Centre (KeNIC)",
    phone: "+254 20 387 4700",
    email: "info@kenic.or.ke"
  },
  {
    id: "domainkenya",
    name: "Domain Kenya",
    phone: "0722 000 000",
    email: "info@domainkenya.co.ke"
  },
  {
    id: "hostingreview",
    name: "Hosting Review Kenya",
    phone: "0700 123 456",
    email: "info@hostingreviewkenya.co.ke"
  },
  {
    id: "smartweb",
    name: "Smart Web Kenya",
    phone: "0722 500 500",
    email: "info@smartwebkenya.co.ke"
  },
  {
    id: "webcom",
    name: "Webcom Kenya",
    phone: "0722 700 700",
    email: "info@webcom.co.ke"
  },
  {
    id: "hostpoa",
    name: "Host POA",
    phone: "0722 800 800",
    email: "info@hostpoa.co.ke"
  },
  {
    id: "digitalocean",
    name: "DigitalOcean Kenya",
    phone: "0700 900 900",
    email: "support@digitalocean.co.ke"
  },
  {
    id: "cloudflare",
    name: "Cloudflare Kenya",
    phone: "0722 111 111",
    email: "support@cloudflare.co.ke"
  },
  {
    id: "hostgator",
    name: "HostGator Kenya",
    phone: "0700 222 222",
    email: "support@hostgator.co.ke"
  },
  {
    id: "namecheap",
    name: "Namecheap Kenya",
    phone: "0722 333 333",
    email: "support@namecheap.co.ke"
  },
  {
    id: "godaddy",
    name: "GoDaddy Kenya",
    phone: "0700 444 444",
    email: "support@godaddy.co.ke"
  },
  {
    id: "bluehost",
    name: "Bluehost Kenya",
    phone: "0722 555 555",
    email: "support@bluehost.co.ke"
  },
  {
    id: "hostinger",
    name: "Hostinger Kenya",
    phone: "0700 666 666",
    email: "support@hostinger.co.ke"
  },
  {
    id: "siteground",
    name: "SiteGround Kenya",
    phone: "0722 777 777",
    email: "support@siteground.co.ke"
  },
  {
    id: "dreamhost",
    name: "DreamHost Kenya",
    phone: "0700 888 888",
    email: "support@dreamhost.co.ke"
  }
];

export const formatRegistrarUrl = (email: string): string => {
  // Convert email to website URL
  const domain = email.split('@')[1];
  return `https://${domain}`;
};
