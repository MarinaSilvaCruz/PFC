package com.example.marina;

import java.util.Arrays;
import java.util.List;

import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.Toast;


public class MainActivity extends Activity {

	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
					
		
/*
	    	public void onClick(View view){
	    	Intent intent = new Intent(Screen1.this , Screen2.class);
	    	startActivity(intent);
	    		

		ListView listaCadastros = (ListView) findViewById(R.id.listaCadastros);
		listaCadastros.setAdapter(adapter);
		listaCadastros.setClickable(true);
		listaCadastros.setOnItemClickListener(new OnItemClickListener() {
			@Override
		/*	public void onItemClick(AdapterView<?> adapter, View view, int posicao, long id)
		{Toast.makeText(MainActivity.this, "Posicao Selecionada:" + posicao, Toast.LENGTH_LONG).show();
		}
		});*/


		
		Button Registro = (Button) findViewById(R.id.buttonregistro);
		Registro.setOnClickListener(new View.OnClickListener() {
            public void onClick(View view) {
            	/*Intent intent = new Intent(MainActivity.this , screen2.class);
            	startActivity(intent);
            	*/
            	
            	Intent myIntent = new Intent(view.getContext(), screen2.class);
                startActivityForResult(myIntent, 0);
            }
	});
		
		Button Comprar = (Button) findViewById(R.id.buttoncomprar);
		Comprar.setOnClickListener(new View.OnClickListener() {
            public void onClick(View view) {
            	Intent intent = new Intent(MainActivity.this , screen3.class);
            	startActivity(intent);
            	
            	/*
                Intent myIntent = new Intent(view.getContext(), screen3.class);
                startActivityForResult(myIntent, 0);*/
            }
		});
	
	
		
	
		}	}

