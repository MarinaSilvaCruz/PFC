package com.example.marina;

import java.util.List;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.ListView;


public class screen3 extends Activity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main3);
		
		final ListView lv = (ListView)findViewById(R.id.list);
		CadastroDAO dao = new CadastroDAO(this);
		List<String> cartoes = dao.getCartoes();
		dao.close();
		ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, cartoes);
		lv.setAdapter(adapter);


		
		lv.setOnItemClickListener(new OnItemClickListener() {
		   @Override
		   public void onItemClick(AdapterView<?> adapter, View view, int position, long arg) {
		     // Object listItem = lv.getItemAtPosition(position);
			   Intent intent = new Intent(screen3.this , Screen4.class);
		    	
	            startActivity(intent);      
	            finish();
		   } 
		});
		
//		
//		lv.setOnItemClickListener(listener)
//		
//		lv.setOnClickListener(
//				new View.OnClickListener() 
//				{
//					public void onClick(View view) {
//						startActivity(new Intent(screen3.this , Screen4.class)
//								);
//					}
//
//				}
//				);


	}
}


