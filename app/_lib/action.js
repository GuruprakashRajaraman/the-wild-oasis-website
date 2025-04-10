"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import { supabase } from "./supabase";
import { redirect } from "next/navigation";
import {  getBookings } from "./data-service";

export async function createBooking(bookingData ,formData){
  console.log(formData , bookingData)
  const session= await auth()
  if(!session) throw new Error ("You must be logged in");

  const newBooking = {
    ...bookingData ,
    guestId : session.user.guestId,
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get('observations').slice(0,1000),
    extraPrice : 0,
    totalPrice : bookingData.cabinPrice ,
    isPaid : false ,
    hasBreakfast : false,
    status : 'unconfirmed',
    }
    console.log(newBooking)

    const { error } = await supabase
    .from('bookings')
    .insert([newBooking])
    // So that the newly created object gets returned!
    .select()
    .single();

    if (error) {
      console.error('Supabase insert error:', error.message, error.details || '', error.hint || '');
      throw new Error('Booking could not be created');
    }
    
  revalidatePath(`/cabins/${bookingData.cabinId}`)

  redirect('/cabins/thankyou')
}

export async function deleteReservation(bookingId){
  const session= await auth()
  if(!session) throw new Error ("You must be logged in");

  const guestBookings = await getBookings(session.user.guestId)
  const guestBookingIds = guestBookings.map((booking)=>booking.id)
  console.log(guestBookingIds, bookingId)
  if(!guestBookingIds.includes(bookingId)) throw new Error('You are not allowed to delete the booking');

  const {  error } = await supabase.from('bookings').delete().eq('id', bookingId);

  if (error) {
    // console.error(error);
    throw new Error('Booking could not be deleted');
  }
  revalidatePath('/account/reservations')
}


export async function updateGuest(formData){
console.log(formData)
    const session= await auth()
    if(!session) throw new Error ("You must be logged in")

    const nationalID=formData.get("nationalID");
    const [nationality , countryFlag]= formData.get("nationality").split("%");

    if(!/^[a-zA-Z0-9]{6,12}$/.test(nationalID)) throw new Error('Please provide a valid national ID')

        const updateData ={nationality, countryFlag , nationalID};
        // console.log(updateData)
        const { data, error } = await supabase
    .from('guests')
    .update(updateData)
    .eq('id', session.user.guestId)

  if (error) {
    // console.error(error);
    throw new Error('Guest could not be updated');
  }
  revalidatePath("/account/profile")
}



export async function signInAction(){
    await signIn("google" ,{redirectTo: '/account'})
}

export async function signoutAction(){
    await signOut({redirectTo:'/'})
}

export async function updateBooking(formData){
  // console.log(formData)

  //1.authentication
  const session= await auth()
  if(!session) throw new Error ("You must be logged in");

   //3.building updatedata
   const updateData ={
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get("observations").slice(0,1000),
  }
  const bookingId = Number(formData.get('bookingId'))

  //2.authorisation
  const guestBookings = await getBookings(session.user.guestId)
  const guestBookingIds = guestBookings.map((booking)=>booking.id)
  if(!guestBookingIds.includes(bookingId)) throw new Error('You are not allowed to update this booking');

 

  //4. mutation
  const {  error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();

    //5.error handling
  if (error) {
    console.error(error);
    console.log(guestBookingIds , bookingId)
    throw new Error('Booking could not be updated');
  }

  //6.revalidation
  revalidatePath('/account/reservations')
  revalidatePath(`/account/reservations/edit/${bookingId}`)

  //7.redirecting
  redirect('/account/reservations');
}