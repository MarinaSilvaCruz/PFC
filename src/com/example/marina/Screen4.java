package com.example.marina;


import com.example.marina.R;

import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.view.Menu;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;


public class Screen4 extends Activity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main2);
		
		final Button button = new Button(this);
		final TextView text = (TextView)findViewById(R.id.textView1);
		
		OnClickListener buttonListener = new View.OnClickListener() {

		    @Override
		    public void onClick(View v) {
		    	String value = text.getText().toString();
		    	Bundle sendBundle=new Bundle();
		    	sendBundle.putString("value", value);
		    	
		    	Intent intent = new Intent(Screen4.this, NFCTransfer.class);
		    	intent.putExtras(sendBundle);
	            startActivity(intent);      
	            finish();
		    
		    	
		    }
		};
		button.setOnClickListener(buttonListener);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}
	
	
}
