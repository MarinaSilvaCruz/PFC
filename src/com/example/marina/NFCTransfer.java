package com.example.marina;
import com.example.marina.R;

import android.annotation.TargetApi;
import android.app.Activity;

import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.NfcAdapter.CreateNdefMessageCallback;
import android.nfc.NfcEvent;
import android.os.Build;
import android.os.Bundle;

import android.widget.TextView;
import android.widget.Toast;



@TargetApi(Build.VERSION_CODES.JELLY_BEAN)
public class NFCTransfer extends Activity implements CreateNdefMessageCallback {
	NfcAdapter mNfcAdapter;
	TextView textView;
	String value;
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);//need to change this
		Bundle receiveBundle=this.getIntent().getExtras();
		value=receiveBundle.getString("value");


		// Check for available NFC Adapter
		mNfcAdapter = NfcAdapter.getDefaultAdapter(this);
		if (mNfcAdapter == null) {
			Toast.makeText(this, "NFC is not available", Toast.LENGTH_LONG).show();
			finish();
			return;
		}
		// Register callback
		mNfcAdapter.setNdefPushMessageCallback(this, this);
	}

	
	@Override
	public NdefMessage createNdefMessage(NfcEvent event) {
		String text = ("Password is "+value+"\n\n" +
				"Beam Time: " + System.currentTimeMillis());

		NdefMessage msg = new NdefMessage(
				new NdefRecord[] { NdefRecord.createMime(
						"application/vnd.com.example.android.beam", text.getBytes())
						/**
						 * The Android Application Record (AAR) is commented out. When a device
						 * receives a push with an AAR in it, the application specified in the AAR
						 * is guaranteed to run. The AAR overrides the tag dispatch system.
						 * You can add it back in to guarantee that this
						 * activity starts when receiving a beamed message. For now, this code
						 * uses the tag dispatch system.
						 */
						//,NdefRecord.createApplicationRecord("com.example.android.beam")
				});
		return msg;
	}



}